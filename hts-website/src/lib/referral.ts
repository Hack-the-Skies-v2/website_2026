import { z } from "zod";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

export const HTS_REF_COOKIE = "hts_ref";

export const HTS_REF_COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
};

export const referralCodeSchema = z
    .string()
    .trim()
    .min(1)
    .max(32)
    .regex(/^[A-Za-z0-9+/=_-]+$/, "Invalid referral code format");

export type RecordReferralResult = {
    success: boolean;
    error?: string;
    isInvalidCode?: boolean;
    isSelfReferral?: boolean;
    isAlreadyReferred?: boolean;
    isAlreadyReferredByThisUser?: boolean;
};

export async function lookupReferralCode(
    code: string,
    supabaseClient?: SupabaseClient,
): Promise<boolean> {
    const parsed = referralCodeSchema.safeParse(code);
    if (!parsed.success) return false;
    try {
        const supabase = supabaseClient ?? (await createClient());
        const { data, error } = await supabase.rpc("lookup_referral_code", {
            p_code: parsed.data,
        });
        if (error) {
            console.log("[lookupReferralCode] error:", error.message);
            return false;
        }
        return !!data;
    } catch {
        return false;
    }
}

export async function recordReferral(
    code: string,
    supabaseClient?: SupabaseClient,
): Promise<RecordReferralResult> {
    const parsed = referralCodeSchema.safeParse(code);
    if (!parsed.success) {
        console.log("[recordReferral] invalid code format:", code);
        return { success: false, error: "Invalid referral code format", isInvalidCode: true };
    }

    try {
        const supabase = supabaseClient ?? (await createClient());
        console.log("[recordReferral] calling RPC record_referral with code:", parsed.data);
        const { error } = await supabase.rpc("record_referral", {
            p_code: parsed.data,
        });

        if (error) {
            console.log("[recordReferral] RPC error:", error.message, "| code:", error.code);
            const msg = error.message || "";
            let isInvalidCode =
                msg.includes("Invalid referral code format") ||
                msg.includes("Referral code not found");
            const isSelfReferral = msg.includes("Self-referral not allowed");
            const isAlreadyReferred = msg.includes("Already referred");

            if (isInvalidCode && !msg.includes("Invalid referral code format")) {
                const exists = await lookupReferralCode(parsed.data, supabase);
                if (exists) {
                    isInvalidCode = false;
                }
            }

            let isAlreadyReferredByThisUser = false;
            if (isAlreadyReferred) {
                try {
                    const { createAdminClient } = await import("@/lib/supabase/admin");
                    const admin = createAdminClient();
                    const { data: { user } } = await supabase.auth.getUser();
                    if (user) {
                        const { data: referrerUser } = await admin
                            .from("users")
                            .select("id")
                            .eq("referral_code", parsed.data)
                            .maybeSingle();

                        if (referrerUser?.id) {
                            const { data: referral } = await admin
                                .from("referrals")
                                .select("id")
                                .eq("referred_user_id", user.id)
                                .eq("referrer_user_id", referrerUser.id)
                                .maybeSingle();

                            if (referral) {
                                isAlreadyReferredByThisUser = true;
                            }
                        }
                    }
                } catch (e) {
                    console.log("[recordReferral] check already referred error:", e);
                }
            }

            return {
                success: false,
                error: msg,
                isInvalidCode,
                isSelfReferral,
                isAlreadyReferred,
                isAlreadyReferredByThisUser,
            };
        }

        console.log("[recordReferral] success");
        return { success: true };
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to record referral";
        console.log("[recordReferral] caught exception:", message);
        return { success: false, error: message };
    }
}

export async function processReferralCookie(
    supabaseClient?: SupabaseClient,
): Promise<{ success: boolean; recorded: boolean; isInvalid?: boolean }> {
    try {
        const cookieStore = await cookies();
        const code = cookieStore.get(HTS_REF_COOKIE)?.value;

        if (!code) {
            return { success: true, recorded: false };
        }

        try {
            cookieStore.delete(HTS_REF_COOKIE);
            cookieStore.set(HTS_REF_COOKIE, "", {
                ...HTS_REF_COOKIE_OPTIONS,
                maxAge: 0,
            });
        } catch {}

        const res = await recordReferral(code, supabaseClient);
        return {
            success: res.success || !!res.isAlreadyReferredByThisUser,
            recorded: res.success,
            isInvalid: res.isInvalidCode,
        };
    } catch {
        return { success: false, recorded: false };
    }
}

export async function getReferrerEmail(refCode?: string | null): Promise<string | null> {
    try {
        const { createAdminClient } = await import("@/lib/supabase/admin");
        const admin = createAdminClient();
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
            const { data: referral } = await admin
                .from("referrals")
                .select("referrer_user_id")
                .eq("referred_user_id", user.id)
                .maybeSingle();

            if (referral?.referrer_user_id) {
                const { data: referrerUser } = await admin.auth.admin.getUserById(referral.referrer_user_id);
                if (referrerUser?.user?.email) {
                    return referrerUser.user.email;
                }
            }
        }

        const cookieStore = await cookies();
        const codeToLookup = refCode || cookieStore.get(HTS_REF_COOKIE)?.value;
        if (codeToLookup) {
            const parsed = referralCodeSchema.safeParse(codeToLookup);
            if (parsed.success) {
                const { data: userByCode } = await admin
                    .from("users")
                    .select("id")
                    .eq("referral_code", parsed.data)
                    .maybeSingle();

                if (userByCode?.id) {
                    const { data: referrerUser } = await admin.auth.admin.getUserById(userByCode.id);
                    if (referrerUser?.user?.email) {
                        return referrerUser.user.email;
                    }
                }
            }
        }

        return null;
    } catch {
        return null;
    }
}
