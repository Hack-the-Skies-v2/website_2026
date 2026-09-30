import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import {
    recordReferral,
    referralCodeSchema,
    HTS_REF_COOKIE,
    HTS_REF_COOKIE_OPTIONS,
} from "@/lib/referral";

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const raw = searchParams.get("ref") || searchParams.get("code");

    console.log("[api/referral] raw ref:", raw);

    const response = NextResponse.next();

    const supabase = createServerClient(
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
        }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    console.log("[api/referral] user.id:", user?.id ?? null, "| userError:", userError?.message ?? null);

    const parsed = referralCodeSchema.safeParse(raw);
    if (!parsed.success) {
        const dest = user ? "/apply?referral=invalid" : "/auth?next=/apply";
        console.log("[api/referral] invalid code → redirecting to", dest);
        return NextResponse.redirect(new URL(dest, request.url));
    }
    const code = parsed.data;

    const { data: valid, error: rpcError } = await supabase.rpc("lookup_referral_code", {
        p_code: code,
    });
    console.log("[api/referral] lookup_referral_code:", valid, "| rpcError:", rpcError?.message ?? null);

    if (!valid) {
        const dest = user
            ? "/apply?referral=invalid"
            : "/auth?next=/apply";
        console.log("[api/referral] code not valid →", dest);
        return NextResponse.redirect(new URL(dest, request.url));
    }

    if (user) {
        console.log("[api/referral] user logged in → recording referral");
        const result = await recordReferral(code, supabase);
        console.log("[api/referral] recordReferral result:", result);

        let dest = "/apply";
        if (result.success || result.isAlreadyReferredByThisUser) {
            dest = "/apply?referral=success";
        } else if (result.isAlreadyReferred) {
            dest = "/apply?referral=already_referred";
        } else if (result.isSelfReferral) {
            dest = "/apply?referral=self";
        } else if (result.isInvalidCode) {
            dest = "/apply?referral=invalid";
        }

        const redirect = NextResponse.redirect(
            new URL(dest, request.url)
        );
        redirect.cookies.delete(HTS_REF_COOKIE);
        return redirect;
    }

    console.log("[api/referral] not logged in → setting cookie and sending to /auth");
    const redirect = NextResponse.redirect(
        new URL("/auth?next=/apply", request.url)
    );
    redirect.cookies.set(HTS_REF_COOKIE, code, HTS_REF_COOKIE_OPTIONS);
    return redirect;
}
