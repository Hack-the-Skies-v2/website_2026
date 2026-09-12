"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

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

type AuthResult = { success: true } | { success: false; error: string };
type OAuthResult =
    | { success: true; url: string }
    | { success: false; error: string };

function validationError(result: {
    success: false;
    error: z.ZodError;
}): AuthResult {
    return {
        success: false,
        error: result.error.issues[0]?.message ?? "Invalid form input",
    };
}

export async function signInWithEmail(
    email: string,
    password: string,
): Promise<AuthResult> {
    const result = signInSchema.safeParse({ email, password });
    if (!result.success) return validationError(result);

    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword(result.data);
    return error
        ? { success: false, error: "Invalid email or password" }
        : { success: true };
}

export async function signInWithGoogle(): Promise<OAuthResult> {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: "https://hacktheskies.com/auth/confirm",
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
    const { error } = await supabase.auth.signUp({
        email: result.data.email,
        password: result.data.password,
        options: {
            data: { full_name: result.data.fullName },
            emailRedirectTo: "https://hacktheskies.com/auth/confirm",
        },
    });

    return error
        ? { success: false, error: "Unable to create your account" }
        : { success: true };
}

export async function resetPassword(email: string): Promise<AuthResult> {
    const result = resetPasswordSchema.safeParse({ email });
    if (!result.success) return validationError(result);

    const supabase = await createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(
        result.data.email,
        {
            redirectTo: "https://hacktheskies.com/auth/update-password",
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

    redirect("/auth");
}
