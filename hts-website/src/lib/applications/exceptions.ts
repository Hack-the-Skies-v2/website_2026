import "server-only";

import { createClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export async function isApplyException(
    supabase: SupabaseServerClient,
    email: string | null | undefined,
): Promise<boolean> {
    const normalizedEmail = email?.trim().toLowerCase();

    if (!normalizedEmail) {
        return false;
    }

    const { data, error } = await supabase
        .from("apply_exceptions")
        .select("email")
        .eq("email", normalizedEmail)
        .eq("is_active", true)
        .maybeSingle();

    if (error) {
        console.error("isApplyException lookup error:", error);
        return false;
    }

    return Boolean(data);
}
