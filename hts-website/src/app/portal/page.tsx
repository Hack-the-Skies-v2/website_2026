import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import AccountMenu from "@/components/AccountMenu";
import { createClient } from "@/lib/supabase/server";
import { HTS_REF_COOKIE, recordReferral } from "@/lib/referral";
import { getApplicationAccess } from "@/lib/applications/access";
import { ensureQrCodeLink } from "@/lib/qr-code";
import type { PortalScheduleEvent } from "@/components/PortalSchedule";
import HackerPortal from "./HackerPortal";

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

	const [{ data: profile }, { data: events }, { data: referralCode }] = await Promise.all([
		supabase.from("users").select("hacker, points, qr_code_link").eq("id", user.id).maybeSingle(),
		supabase.from("schedule_events").select("id, title, description, type, start_time, end_time, location").order("start_time"),
		supabase.rpc("get_my_referral_code"),
	]);

	const access = await getApplicationAccess(supabase, user.id);

	if (access.isJudge || access.isMentor) {
		redirect("/jm-portal");
	}

	if (!access.isHacker) {
		redirect("/apply");
	}
	const qrCode = profile?.qr_code_link ?? await ensureQrCodeLink(user.id);

	const schedule: PortalScheduleEvent[] = (events ?? []).map((item) => ({
		id: item.id,
		title: item.title,
		description: item.description ?? "",
		start_time: item.start_time,
		end_time: item.end_time,
		location: item.location ?? "",
		type: item.type,
	}));

	return (
		<>
			<HackerPortal name={user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "Hacker"} email={user.email ?? ""} points={profile?.points ?? 0} qrCode={qrCode} schedule={schedule} referralCode={referralCode ?? null} />
		</>
	);
}
