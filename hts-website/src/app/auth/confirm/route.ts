import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

const allowedTypes = ["signup", "email", "recovery"] as const;
type AllowedOtpType = (typeof allowedTypes)[number];

function isAllowedOtpType(value: string | null): value is AllowedOtpType {
    return value !== null && allowedTypes.includes(value as AllowedOtpType);
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const token_hash = searchParams.get("token_hash");
    const rawType = searchParams.get("type");
    const redirectTo = request.nextUrl.clone();
    redirectTo.searchParams.delete("token_hash");
    redirectTo.searchParams.delete("type");
    redirectTo.searchParams.delete("code");

    if (code) {
        const supabase = await createClient();
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (!error) {
            const next = searchParams.get("next");
            redirectTo.pathname =
                next && next.startsWith("/") && !next.startsWith("//")
                    ? next
                    : "/apply";
            redirectTo.searchParams.delete("next");
            return NextResponse.redirect(redirectTo);
        }
    }

    if (token_hash && isAllowedOtpType(rawType)) {
        const type: EmailOtpType = rawType;
        const supabase = await createClient();

        const { data, error } = await supabase.auth.verifyOtp({
            type,
            token_hash,
        });
        if (!error) {
            redirectTo.searchParams.delete("next");
            redirectTo.pathname = type === "recovery"
                ? "/auth/update-password"
                : data.session
                    ? "/apply"
                    : "/auth";
            if (!data.session && type !== "recovery") {
                redirectTo.searchParams.set("confirmed", "1");
            }
            return NextResponse.redirect(redirectTo);
        }
    }

    redirectTo.pathname = "/auth/error";
    redirectTo.search = "";
    return NextResponse.redirect(redirectTo);
}
