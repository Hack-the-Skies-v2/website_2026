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

	const [{ data: profile }, { data: application }, { data: meals }, { data: workshops }, { data: referralCode }] = await Promise.all([
		supabase.from("users").select("hacker, points, qr_code_link").eq("id", user.id).maybeSingle(),
		supabase.from("applications").select("application_type").eq("user_id", user.id).maybeSingle(),
		supabase.from("meals").select("id, name, starts_at, ends_at").order("starts_at"),
		supabase.from("workshops").select("id, name, description, room, starts_at, ends_at").order("starts_at"),
		supabase.rpc("get_my_referral_code"),
	]);

	if (application?.application_type === "judge" || application?.application_type === "mentor") {
		redirect("/jm-portal");
	}

	const hasSubmittedHackerApp = Boolean(
		profile?.hacker || application?.application_type === "hacker",
	);

	if (!hasSubmittedHackerApp) {
		redirect("/apply");
	}

	const schedule: ScheduleItem[] = [
		...(workshops ?? []).map((item) => ({ id: item.id, name: item.name, description: item.description, startsAt: item.starts_at, endsAt: item.ends_at, location: item.room, type: "Workshop" as const })),
		...(meals ?? []).map((item) => ({ id: item.id, name: item.name, description: "Time to refuel and connect with other hackers.", startsAt: item.starts_at, endsAt: item.ends_at, location: "Dining hall", type: "Meal" as const })),
	].sort((a, b) => a.startsAt.localeCompare(b.startsAt));

	return (
		<>
			<HackerPortal name={user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "Hacker"} email={user.email ?? ""} points={profile?.points ?? 0} qrCode={profile?.qr_code_link ?? null} schedule={schedule} referralCode={referralCode ?? null} />
		</>
	);
}
