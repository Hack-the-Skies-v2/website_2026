"use server";

import { z } from "zod";
import { cookies, headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { processReferralCookie } from "@/lib/referral";

const emailSchema = z.string().trim().toLowerCase().pipe(z.email().max(254));
const passwordSchema = z.string().min(1, "Password is required").max(128);
const fullNameSchema = z
    .string()
    .trim()
    .min(1, "Full name is required")
    .max(100, "Full name is too long")
    .refine(
        (value) => !/[<>]/.test(value),
        "Full name contains invalid characters",
    );

const signInSchema = z.object({
    email: emailSchema,
    password: passwordSchema,
});

const signUpSchema = signInSchema
    .extend({
        fullName: fullNameSchema,
        confirmPassword: z.string(),
        termsAgreed: z
            .boolean()
            .refine(Boolean, "You must accept the terms and privacy policy"),
    })
    .refine((value) => value.password === value.confirmPassword, {
        path: ["confirmPassword"],
        message: "Passwords do not match",
    });

const resetPasswordSchema = z.object({ email: emailSchema });
const updatePasswordSchema = z
    .object({
        newPassword: z.string().min(8, "Password must be at least 8 characters long").max(128),
        confirmPassword: z.string(),
    })
    .refine((value) => value.newPassword === value.confirmPassword, {
        path: ["confirmPassword"],
        message: "Passwords do not match",
    });

type AuthResult = { success: true; referralRecorded?: boolean } | { success: false; error: string };
type OAuthResult =
    | { success: true; url: string }
    | { success: false; error: string };

const AUTH_NEXT_COOKIE = "auth_next";

function validationError(result: {
    success: false;
    error: z.ZodError;
}): AuthResult {
    return {
        success: false,
        error: result.error.issues[0]?.message ?? "Invalid form input",
    };
}

function safeNextPath(nextPath: string) {
    return nextPath.startsWith("/") && !nextPath.startsWith("//")
        ? nextPath
        : "/apply";
}

function formatSiteUrl(url: string): string {
    let sanitized = url.trim().replace(/\/+$/, "");
    if (!/^https?:\/\//i.test(sanitized)) {
        const isLocal =
            sanitized.startsWith("localhost") ||
            sanitized.startsWith("127.0.0.1") ||
            sanitized.startsWith("[::1]");
        sanitized = `${isLocal ? "http" : "https"}://${sanitized}`;
    }
    return sanitized;
}

async function requestOrigin() {
    try {
        const headerStore = await headers();
        const host =
            headerStore.get("x-forwarded-host")?.split(",")[0]?.trim() ||
            headerStore.get("host")?.split(",")[0]?.trim();
        const forwardedProto = headerStore
            .get("x-forwarded-proto")
            ?.split(",")[0]
            ?.trim();

        if (host) {
            const isLocal =
                host.startsWith("localhost") ||
                host.startsWith("127.0.0.1") ||
                host.startsWith("[::1]");
            const proto = forwardedProto || (isLocal ? "http" : "https");
            return `${proto}://${host}`;
        }
    } catch { }

    const envUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
    if (envUrl) {
        return formatSiteUrl(envUrl);
    }

    return "https://www.hacktheskies.com";
}

export async function signInWithEmail(
    email: string,
    password: string,
): Promise<AuthResult> {
    const result = signInSchema.safeParse({ email, password });
    if (!result.success) return validationError(result);

    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword(result.data);
    if (error) {
        return { success: false, error: "Invalid email or password" };
    }

    const referralResult = await processReferralCookie(supabase);

    return { success: true, referralRecorded: referralResult.recorded };
}

export async function signInWithGoogle(
    nextPath = "/apply",
): Promise<OAuthResult> {
    try {
        const supabase = await createClient();
        const safeNext = safeNextPath(nextPath);
        const origin = await requestOrigin();
        const cookieStore = await cookies();
        cookieStore.set(AUTH_NEXT_COOKIE, safeNext, {
            path: "/",
            maxAge: 60 * 10,
            httpOnly: true,
            sameSite: "lax",
            secure: origin.startsWith("https://"),
        });

        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: `${origin}/auth/confirm`,
            },
        });

        if (error || !data.url) {
            return { success: false, error: "Unable to sign in with Google" };
        }

        return { success: true, url: data.url };
    } catch {
        return { success: false, error: "Unable to sign in with Google" };
    }
}

export async function signUpNewUser(
    fullName: string,
    email: string,
    password: string,
    confirmPassword: string,
    termsAgreed: boolean,
): Promise<AuthResult> {
    const result = signUpSchema.safeParse({
        fullName,
        email,
        password,
        confirmPassword,
        termsAgreed,
    });
    if (!result.success) return validationError(result);

    const supabase = await createClient();
    const origin = await requestOrigin();
    const { data, error } = await supabase.auth.signUp({
        email: result.data.email,
        password: result.data.password,
        options: {
            data: { full_name: result.data.fullName },
            emailRedirectTo: `${origin}/auth/confirm`,
        },
    });

    if (error) {
        return { success: false, error: "Unable to create your account" };
    }

    if (data?.session) {
        await processReferralCookie(supabase);
    }

    return { success: true };
}

export async function resetPassword(email: string): Promise<AuthResult> {
    const result = resetPasswordSchema.safeParse({ email });
    if (!result.success) return validationError(result);

    const supabase = await createClient();
    const origin = await requestOrigin();
    const { error } = await supabase.auth.resetPasswordForEmail(
        result.data.email,
        {
            redirectTo: `${origin}/auth/update-password`,
        },
    );

    return error
        ? { success: false, error: "Unable to send the reset link" }
        : { success: true };
}

export async function updatePassword(
    newPassword: string,
    confirmPassword: string,
): Promise<AuthResult> {
    const result = updatePasswordSchema.safeParse({
        newPassword,
        confirmPassword,
    });
    if (!result.success) return validationError(result);

    try {
        const supabase = await createClient();
        const { error } = await supabase.auth.updateUser({
            password: result.data.newPassword,
        });

        return error
            ? { success: false, error: "Unable to update your password" }
            : { success: true };
    } catch {
        return { success: false, error: "Unable to update your password" };
    }
}

export async function logout(): Promise<never> {
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/auth");
}

export async function deleteCurrentUser(): Promise<never> {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) redirect("/auth");

    const { error } = await supabase.rpc("delete_current_user");

    if (error) {
        throw new Error("Unable to delete your account");
    }

    try {
        await supabase.auth.signOut();
    } catch {}

    try {
        const cookieStore = await cookies();
        for (const cookie of cookieStore.getAll()) {
            if (cookie.name.includes("sb-") || cookie.name.includes("auth") || cookie.name === "hts_ref") {
                cookieStore.delete(cookie.name);
            }
        }
    } catch {}

    redirect("/auth");
}
