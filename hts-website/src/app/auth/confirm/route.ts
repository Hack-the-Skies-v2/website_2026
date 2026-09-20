import { type EmailOtpType } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

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

function createConfirmClient(request: NextRequest, response: NextResponse) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );
}

function redirectToPath(request: NextRequest, pathname: string, search = "") {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = search;
  const response = NextResponse.redirect(url);
  response.cookies.set(AUTH_NEXT_COOKIE, "", { path: "/", maxAge: 0 });
  return response;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const rawType = searchParams.get("type");
  const nextPath = resolveNext(request);

  if (code) {
    const response = redirectToPath(request, nextPath);
    const supabase = createConfirmClient(request, response);
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return response;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      return response;
    }
  }

  if (token_hash && isAllowedOtpType(rawType)) {
    const type: EmailOtpType = rawType;
    const pathname = type === "recovery" ? "/auth/update-password" : nextPath;
    const response = redirectToPath(request, pathname);
    const supabase = createConfirmClient(request, response);

    const { data, error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });

    if (!error) {
      if (type === "recovery" || data.session) {
        return response;
      }
      return redirectToPath(request, "/auth", "confirmed=1");
    }
  }

  return redirectToPath(request, "/auth/error");
}
