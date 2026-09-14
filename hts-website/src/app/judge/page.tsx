import Link from "next/link";
import { redirect } from "next/navigation";
import AccountMenu from "@/components/AccountMenu";
import { createClient } from "@/lib/supabase/server";
import JudgeForm from "./JudgeForm";

export default async function JudgePage() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/auth");
    }

    const [{ data: profile }, { data: application }] = await Promise.all([
        supabase.from("users").select("judge").eq("id", user.id).maybeSingle(),
        supabase.from("applications").select("application_type").eq("user_id", user.id).maybeSingle(),
    ]);

    const isJudge = Boolean(profile?.judge || application?.application_type === "judge");

    if (!isJudge) {
        return (
            <main className="relative z-10 flex min-h-screen items-center justify-center px-6 py-20 font-outfit text-primary">
                <AccountMenu email={user.email ?? ""} />
                <section className="w-full max-w-lg rounded-3xl border border-primary/20 bg-[#171329]/95 p-8 text-center shadow-[0_0_45px_rgba(107,87,155,0.25)] backdrop-blur-xl sm:p-12">
                    <h1 className="mt-4 text-3xl font-semibold sm:text-4xl">Access restricted</h1>
                    <Link
                        href="/jm-portal"
                        className="mt-8 inline-flex rounded-full bg-button px-6 py-3 font-semibold text-white shadow-[0_0_20px_rgba(130,104,180,0.4)] transition hover:bg-[#8268B4]"
                    >
                        Return to portal
                    </Link>
                </section>
            </main>
        );
    }

    return (
        <main className="relative z-10 min-h-screen px-6 py-20 font-outfit text-primary sm:px-10 lg:px-16">
            <AccountMenu email={user.email ?? ""} />
            <div className="mx-auto w-full max-w-6xl">
                <Link
                    href="/jm-portal"
                    className="text-sm text-primary/55 transition hover:text-primary"
                >
                    ← Back to Judge & Mentor Portal
                </Link>
                {/* <JudgeForm /> */}
                <section className="mt-10 max-w-3xl rounded-3xl border border-primary/20 bg-[#171329]/90 p-8 text-center shadow-[0_0_45px_rgba(107,87,155,0.2)] backdrop-blur-xl sm:p-12">
                    <h1 className="text-3xl font-semibold sm:text-4xl text-primary">Judging Portal</h1>
                    <p className="mt-3 text-lg text-primary/70">Coming Soon</p>
                </section>
            </div>
        </main>
    );
}
