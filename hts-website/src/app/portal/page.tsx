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

	if (!user) redirect("/auth?next=/portal");

	const cookieStore = await cookies();
	const cookieRef = cookieStore.get(HTS_REF_COOKIE)?.value;
	if (cookieRef) {
		await recordReferral(cookieRef, supabase);
		try {
			cookieStore.delete(HTS_REF_COOKIE);
		} catch {}
	}

	const [{ data: profile }, { data: userPoints }, { data: events }, { data: prizes, error: prizesError }, { data: pointActions, error: pointActionsError }, { data: pointEarnings, error: pointEarningsError }, { data: prizeRedemptions, error: prizeRedemptionsError }] = await Promise.all([
		supabase.from("users").select("qr_code_link").eq("id", user.id).maybeSingle(),
		supabase.from("user_points").select("balance").eq("user_id", user.id).maybeSingle(),
		supabase.from("schedule_events").select("id, title, description, type, start_time, end_time, location").order("start_time"),
		supabase
			.from("point_prize_inventory")
			.select("id, name, description, points_required, quantity, max_redemptions, remaining_quantity")
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
		supabase
			.from("prize_redemptions")
			.select("prize_id")
			.eq("user_id", user.id),
	]);

	if (prizesError) throw new Error(`Failed to load point prizes: ${prizesError.message}`);
	if (pointActionsError) throw new Error(`Failed to load point actions: ${pointActionsError.message}`);
	if (pointEarningsError) throw new Error(`Failed to load point earnings: ${pointEarningsError.message}`);
	if (prizeRedemptionsError) throw new Error(`Failed to load prize redemptions: ${prizeRedemptionsError.message}`);

	const earnedCounts = new Map<string, number>();
	for (const earning of pointEarnings ?? []) {
		earnedCounts.set(earning.point_action_id, (earnedCounts.get(earning.point_action_id) ?? 0) + 1);
	}
	const portalPointActions: PortalPointAction[] = (pointActions ?? []).map((action) => ({
		...action,
		earned_count: earnedCounts.get(action.id) ?? 0,
	}));
	const userPrizeRedemptionCounts: Record<string, number> = {};
	for (const redemption of prizeRedemptions ?? []) {
		userPrizeRedemptionCounts[redemption.prize_id] = (userPrizeRedemptionCounts[redemption.prize_id] ?? 0) + 1;
	}

	const access = await getApplicationAccess(supabase, user.id);

	if (access.isJudge || access.isMentor) {
		redirect("/jm-portal");
	}

	if (!access.isHacker) {
		redirect("/apply");
	}
	const { data: hackerApplication, error: hackerApplicationError } = await supabase
		.from("hacker_applications")
		.select("first_name, last_name, preferred_name")
		.eq("user_id", user.id)
		.maybeSingle();
	if (hackerApplicationError) throw new Error(`Failed to load hacker application name: ${hackerApplicationError.message}`);
	const hackerName =
		hackerApplication?.preferred_name?.trim() ||
		[hackerApplication?.first_name, hackerApplication?.last_name].filter(Boolean).join(" ").trim() ||
		"Hacker";
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
			<HackerPortal name={hackerName} email={user.email ?? ""} points={userPoints?.balance ?? 0} qrCode={qrCode} schedule={schedule} prizes={(prizes ?? []) as PortalPrize[]} userPrizeRedemptionCounts={userPrizeRedemptionCounts} pointActions={portalPointActions} />
		</>
	);
}
