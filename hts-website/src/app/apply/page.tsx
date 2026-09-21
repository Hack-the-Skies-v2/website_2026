import Link from "next/link";
import Footer from "@/components/Footer";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ApplicationForm from "@/components/ApplicationForm";
import AccountMenu from "../../components/AccountMenu";

export const dynamic = "force-dynamic";

export default async function Apply({
    searchParams,
}: {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
    const params = await searchParams;
    const ref = typeof params.ref === "string" ? params.ref : null;

    if (ref) {
        redirect(`/api/referral?code=${encodeURIComponent(ref)}`);
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/auth");
    }

    const [
        { data: application },
        { data: hackerApp },
        { data: judgeApp },
        { data: mentorApp },
    ] = await Promise.all([
        supabase
            .from("applications")
            .select("user_id, application_type")
            .eq("user_id", user.id)
            .maybeSingle(),
        supabase
            .from("hacker_applications")
            .select("user_id")
            .eq("user_id", user.id)
            .maybeSingle(),
        supabase
            .from("judge_applications")
            .select("user_id")
            .eq("user_id", user.id)
            .maybeSingle(),
        supabase
            .from("mentor_applications")
            .select("user_id")
            .eq("user_id", user.id)
            .maybeSingle(),
    ]);

    // console.log("[apply/page] user.id:", user.id);
    // console.log("[apply/page] applications row:", application);
    // console.log("[apply/page] hackerApp:", hackerApp, "judgeApp:", judgeApp, "mentorApp:", mentorApp);

    const appType = application?.application_type?.toLowerCase();

    if (appType === "judge" || judgeApp) {
        redirect("/jm-portal");
    }
    if (appType === "mentor" || mentorApp) {
        redirect("/jm-portal");
    }
    if (appType === "hacker" || hackerApp || application) {
        redirect("/portal");
    }

    // console.log("[apply/page] no application found — showing form");

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
                <div className="pt-24 pb-12 px-4 sm:px-6 max-w-4xl mx-auto">
                    <h1 className="
						text-center
						font-outfit text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-semibold text-primary select-none mb-12">
                        Application Portal
                    </h1>
                </div>
                <ApplicationForm />
            </div>
            <Footer />
        </main>
    );
}
