import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const codeSchema = z
  .string()
  .min(1)
  .max(32)
  .regex(/^[A-Za-z0-9+/=_-]+$/);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const raw = searchParams.get("code");

  const parsed = codeSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.redirect(new URL("/apply", request.url));
  }
  const code = parsed.data;

  const supabase = await createClient();
  const { data: valid } = await supabase.rpc("lookup_referral_code", {
    p_code: code,
  });

  const response = NextResponse.redirect(new URL("/apply", request.url));

  if (valid) {
    response.cookies.set("hts_ref", code, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  }

  return response;
}

