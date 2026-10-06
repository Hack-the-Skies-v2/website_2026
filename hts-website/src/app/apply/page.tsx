import Link from "next/link";
import Footer from "@/components/Footer";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import ApplicationForm from "@/components/ApplicationForm";
import AccountMenu from "../../components/AccountMenu";
import ReferralToast from "@/components/ReferralToast";
import { HTS_REF_COOKIE, recordReferral, getReferrerEmail } from "@/lib/referral";
import { getApplicationAccess } from "@/lib/applications/access";
import { isApplyException } from "@/lib/applications/exceptions";
import { areApplicationsOpen } from "@/lib/applications/deadline";
import { logout } from "@/actions/auth";

export const dynamic = "force-dynamic";

export default async function Apply({
    searchParams,
}: {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        const params = await searchParams;
        const ref = typeof params.ref === "string" ? params.ref : null;

        if (ref) {
            redirect(`/api/referral?ref=${encodeURIComponent(ref)}`);
        }
        redirect("/auth?next=/apply");
    }

    const hasApplyException = user ? await isApplyException(supabase, user.email) : false;

    if (!areApplicationsOpen() && !hasApplyException) {
        return (
            <main className="flex min-h-screen items-center justify-center px-6 py-20">
                <div className="text-center">
                    <h1 className="font-outfit text-4xl font-semibold text-primary drop-shadow-[0_0_12px_rgba(193,185,242,0.5)] md:text-5xl">
                        Applications Closed
                    </h1>
                    <p className="mt-4 max-w-xl font-outfit text-base leading-relaxed text-primary/80 md:text-lg">
                        Applications for Hack the Skies have closed.
                    </p>
                    <div className="mt-8 flex items-center justify-center gap-3">
                        <Link
                            href="/"
                            className="inline-flex rounded-full bg-button px-6 py-3 font-outfit text-base text-white shadow-[0_0_20px_rgba(130,104,180,0.45)] transition-all duration-150 hover:bg-[#8268B4] hover:scale-[1.02]"
                        >
                            Return Home
                        </Link>
                        <form action={logout}>
                            <button
                                type="submit"
                                className="inline-flex cursor-pointer rounded-full bg-button px-6 py-3 font-outfit text-base text-white shadow-[0_0_20px_rgba(130,104,180,0.45)] transition-all duration-150 hover:bg-[#8268B4] hover:scale-[1.02]"
                            >
                                Log out
                            </button>
                        </form>
                    </div>
                </div>
            </main>
        );
    }

    const params = await searchParams;
    const ref = typeof params.ref === "string" ? params.ref : null;

    if (ref) {
        const cookieStore = await cookies();
        try { cookieStore.delete(HTS_REF_COOKIE); } catch { }

        const result = await recordReferral(ref, supabase);
        if (result.success || result.isAlreadyReferredByThisUser) {
            redirect("/apply?referral=success");
        } else if (result.isAlreadyReferred) {
            redirect("/apply?referral=already_referred");
        } else if (result.isSelfReferral) {
            redirect("/apply?referral=self");
        } else if (result.isInvalidCode) {
            redirect("/apply?referral=invalid");
        } else {
            redirect("/apply");
        }
    }

    const cookieStore = await cookies();
    const cookieRef = cookieStore.get(HTS_REF_COOKIE)?.value;
    if (cookieRef) {
        try {
            cookieStore.delete(HTS_REF_COOKIE);
        } catch { }

        const result = await recordReferral(cookieRef, supabase);
        if (result.success || result.isAlreadyReferredByThisUser) {
            redirect("/apply?referral=success");
        } else if (result.isAlreadyReferred) {
            redirect("/apply?referral=already_referred");
        } else if (result.isSelfReferral) {
            redirect("/apply?referral=self");
        } else if (result.isInvalidCode) {
            redirect("/apply?referral=invalid");
        } else {
            redirect("/apply");
        }
    }

    const access = await getApplicationAccess(supabase, user.id);

    if (!hasApplyException) {
        if (access.isJudge || access.isMentor) {
            redirect("/jm-portal");
        }
        if (access.isHacker) {
            redirect("/portal");
        }
    }

    const referrerEmail = await getReferrerEmail();

    return (
        <main className="flex flex-col min-h-screen">
            <AccountMenu email={user.email ?? ""} />
            <Link href="/">
                <button
                    type="button"
                    className="
                        fixed top-4 right-4 z-50
                        rounded-full
                        bg-button
                        px-6 py-2
                        font-outfit
                        text-base text-white
                        shadow-[0_0_20px_rgba(130,104,180,0.45)]
                        transition-all duration-150
                        md:px-8 md:py-3 md:text-lg
                        hover:bg-[#8268B4]
                        cursor-pointer
                        hover:scale-105
                    "
                >
                    Return to Home
                </button>
            </Link>
            <div className="flex-1">
                <div className="pt-24 pb-8 px-4 sm:px-6 max-w-4xl mx-auto">
                    <h1 className="
						text-center
						font-outfit text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-semibold text-primary select-none mb-8">
                        Application Portal
                    </h1>
                </div>
                <ApplicationForm referrerEmail={referrerEmail} />
            </div>
            <Footer />
            <ReferralToast />
        </main>
    );
}
