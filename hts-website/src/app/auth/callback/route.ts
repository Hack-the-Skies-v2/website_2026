import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");
  const requestedNext = searchParams.get("next") ?? "/organizers";
  const next = requestedNext.startsWith("/") && !requestedNext.startsWith("//") ? requestedNext : "/organizers";

  if (error || errorDescription) {
    const message = errorDescription || error || "OAuth authentication failed.";
    return NextResponse.redirect(`${origin}/organizers/sign-in?error=${encodeURIComponent(message)}`);
  }

  if (code) {
    const supabase = await createClient();
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    if (!exchangeError) {
      return NextResponse.redirect(`${origin}${next}`);
    }
    return NextResponse.redirect(
      `${origin}/organizers/sign-in?error=${encodeURIComponent(exchangeError.message)}`
    );
  }

  return NextResponse.redirect(`${origin}/organizers/sign-in?error=auth`);
}

