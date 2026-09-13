import Link from "next/link";
import { redirect } from "next/navigation";
import AccountMenu from "@/components/AccountMenu";
import { createClient } from "@/lib/supabase/server";
import HackerPortal from "./HackerPortal";

type ScheduleItem = {
	id: string;
	name: string;
	description: string;
	startsAt: string;
	endsAt: string;
	location: string;
	type: "Workshop" | "Meal";
};

export default async function PortalPage() {
	const supabase = await createClient();
	const { data: { user } } = await supabase.auth.getUser();

	if (!user) redirect("/auth");

	const [{ data: profile }, { data: meals }, { data: workshops }] = await Promise.all([
		supabase.from("users").select("hacker, points, qr_code_link").eq("id", user.id).maybeSingle(),
		supabase.from("meals").select("id, name, starts_at, ends_at").order("starts_at"),
		supabase.from("workshops").select("id, name, description, room, starts_at, ends_at").order("starts_at"),
	]);

	if (!profile?.hacker) {
		return (
			<main className="relative z-10 flex min-h-screen items-center justify-center px-6 py-20 font-outfit text-primary">
				<AccountMenu email={user.email ?? ""} />
				<section className="w-full max-w-lg rounded-3xl border border-primary/20 bg-[#171329]/95 p-8 text-center shadow-[0_0_45px_rgba(107,87,155,0.25)] backdrop-blur-xl sm:p-12">
					<h1 className="text-3xl font-semibold sm:text-4xl">Access restricted</h1>
					<p className="mt-4 text-primary/60">This portal is available to accepted hackers only.</p>
					<Link href="/" className="mt-8 inline-flex rounded-full bg-button px-6 py-3 font-semibold text-white shadow-[0_0_20px_rgba(130,104,180,0.4)] transition hover:bg-[#8268B4]">Return home</Link>
				</section>
			</main>
		);
	}

	const schedule: ScheduleItem[] = [
		...(workshops ?? []).map((item) => ({ id: item.id, name: item.name, description: item.description, startsAt: item.starts_at, endsAt: item.ends_at, location: item.room, type: "Workshop" as const })),
		...(meals ?? []).map((item) => ({ id: item.id, name: item.name, description: "Time to refuel and connect with other hackers.", startsAt: item.starts_at, endsAt: item.ends_at, location: "Dining hall", type: "Meal" as const })),
	].sort((a, b) => a.startsAt.localeCompare(b.startsAt));

	return (
		<>
			<HackerPortal name={user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "Hacker"} email={user.email ?? ""} points={profile.points} qrCode={profile.qr_code_link} schedule={schedule} />
		</>
	);
}
