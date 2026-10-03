import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import AccountMenu from "@/components/AccountMenu";
import { createClient } from "@/lib/supabase/server";
import { HTS_REF_COOKIE, recordReferral } from "@/lib/referral";
import { getApplicationAccess } from "@/lib/applications/access";
import { ensureQrCodeLink } from "@/lib/qr-code";
import type { PortalScheduleEvent } from "@/components/PortalSchedule";
import HackerPortal, { type PortalPointAction, type PortalPrize } from "./HackerPortal";

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

	const [{ data: profile }, { data: userPoints }, { data: events }, { data: referralCode }, { data: prizes, error: prizesError }, { data: pointActions, error: pointActionsError }, { data: pointEarnings, error: pointEarningsError }] = await Promise.all([
		supabase.from("users").select("hacker, qr_code_link").eq("id", user.id).maybeSingle(),
		supabase.from("user_points").select("balance").eq("user_id", user.id).maybeSingle(),
		supabase.from("schedule_events").select("id, title, description, type, start_time, end_time, location").order("start_time"),
		supabase.rpc("get_my_referral_code"),
		supabase
			.from("point_prizes")
			.select("id, name, description, points_required, quantity, max_redemptions")
			.eq("active", true)
			.order("points_required")
			.order("name"),
		supabase
			.from("point_actions")
			.select("id, name, description, points, max_redemptions, active")
			.order("points"),
		supabase
			.from("point_earnings")
			.select("point_action_id")
			.eq("user_id", user.id),
	]);

	if (prizesError) throw new Error(`Failed to load point prizes: ${prizesError.message}`);
	if (pointActionsError) throw new Error(`Failed to load point actions: ${pointActionsError.message}`);
	if (pointEarningsError) throw new Error(`Failed to load point earnings: ${pointEarningsError.message}`);

	const earnedCounts = new Map<string, number>();
	for (const earning of pointEarnings ?? []) {
		earnedCounts.set(earning.point_action_id, (earnedCounts.get(earning.point_action_id) ?? 0) + 1);
	}
	const portalPointActions: PortalPointAction[] = (pointActions ?? []).map((action) => ({
		...action,
		earned_count: earnedCounts.get(action.id) ?? 0,
	}));

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
			<HackerPortal name={user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "Hacker"} email={user.email ?? ""} points={userPoints?.balance ?? 0} qrCode={qrCode} schedule={schedule} referralCode={referralCode ?? null} prizes={(prizes ?? []) as PortalPrize[]} pointActions={portalPointActions} />
		</>
	);
}
