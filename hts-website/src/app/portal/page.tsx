import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import AccountMenu from "@/components/AccountMenu";
import { createClient } from "@/lib/supabase/server";
import { HTS_REF_COOKIE, recordReferral } from "@/lib/referral";
import { getApplicationAccess } from "@/lib/applications/access";
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

	const cookieStore = await cookies();
	const cookieRef = cookieStore.get(HTS_REF_COOKIE)?.value;
	if (cookieRef) {
		await recordReferral(cookieRef, supabase);
		try {
			cookieStore.delete(HTS_REF_COOKIE);
		} catch {}
	}

	const [{ data: profile }, { data: meals }, { data: workshops }, { data: referralCode }] = await Promise.all([
		supabase.from("users").select("hacker, points, qr_code_link").eq("id", user.id).maybeSingle(),
		supabase.from("meals").select("id, name, starts_at, ends_at").order("starts_at"),
		supabase.from("workshops").select("id, name, description, room, starts_at, ends_at").order("starts_at"),
		supabase.rpc("get_my_referral_code"),
	]);

	const access = await getApplicationAccess(supabase, user.id);

	if (access.isJudge || access.isMentor) {
		redirect("/jm-portal");
	}

	if (!access.isHacker) {
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
