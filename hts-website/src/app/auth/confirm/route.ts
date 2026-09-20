import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

const allowedTypes = ["signup", "email", "recovery"] as const;
type AllowedOtpType = (typeof allowedTypes)[number];
const AUTH_NEXT_COOKIE = "auth_next";

function isAllowedOtpType(value: string | null): value is AllowedOtpType {
    return value !== null && allowedTypes.includes(value as AllowedOtpType);
}

function resolveNext(request: NextRequest): string {
    const fromQuery = request.nextUrl.searchParams.get("next");
    const fromCookie = request.cookies.get(AUTH_NEXT_COOKIE)?.value;
    const candidate = fromQuery || fromCookie || "/apply";
    return candidate.startsWith("/") && !candidate.startsWith("//")
        ? candidate
        : "/apply";
}

function redirectWithClearedNext(request: NextRequest, pathname: string) {
    const redirectTo = request.nextUrl.clone();
    redirectTo.pathname = pathname;
    redirectTo.search = "";
    const response = NextResponse.redirect(redirectTo);
    response.cookies.set(AUTH_NEXT_COOKIE, "", {
        path: "/",
        maxAge: 0,
    });
    return response;
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const token_hash = searchParams.get("token_hash");
    const rawType = searchParams.get("type");
    const nextPath = resolveNext(request);

    if (code) {
        const supabase = await createClient();
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (!error) {
            return redirectWithClearedNext(request, nextPath);
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
            if (type === "recovery") {
                return redirectWithClearedNext(request, "/auth/update-password");
            }
            if (data.session) {
                return redirectWithClearedNext(request, nextPath);
            }
            const redirectTo = request.nextUrl.clone();
            redirectTo.pathname = "/auth";
            redirectTo.search = "";
            redirectTo.searchParams.set("confirmed", "1");
            const response = NextResponse.redirect(redirectTo);
            response.cookies.set(AUTH_NEXT_COOKIE, "", { path: "/", maxAge: 0 });
            return response;
        }
    }

    return redirectWithClearedNext(request, "/auth/error");
}
