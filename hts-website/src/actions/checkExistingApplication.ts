"use server";

import { createClient } from "@/lib/supabase/server";

export type ExistingApplicationResult = {
	submitted: boolean;
	role?: "hacker" | "judge" | "mentor";
	redirectUrl?: "/portal" | "/jm-portal";
};

export async function checkExistingApplication(): Promise<ExistingApplicationResult> {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) return { submitted: false };

	const [
		{ data: application },
		{ data: hackerApp },
		{ data: judgeApp },
		{ data: mentorApp },
		{ data: profile },
	] = await Promise.all([
		supabase
			.from("applications")
			.select("user_id, application_type, type")
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
		supabase
			.from("users")
			.select("hacker, judge, mentor")
			.eq("id", user.id)
			.maybeSingle(),
	]);

	const rawType = (
		application?.application_type ||
		(application as { type?: string } | null)?.type
	)?.toLowerCase();

	const isJudge = Boolean(profile?.judge || rawType === "judge" || judgeApp);
	const isMentor = Boolean(profile?.mentor || rawType === "mentor" || mentorApp);
	const isHacker = Boolean(
		profile?.hacker ||
			rawType === "hacker" ||
			hackerApp ||
			(application && !isJudge && !isMentor),
	);

	if (isJudge || isMentor) {
		return {
			submitted: true,
			role: isJudge ? "judge" : "mentor",
			redirectUrl: "/jm-portal",
		};
	}

	if (isHacker) {
		return {
			submitted: true,
			role: "hacker",
			redirectUrl: "/portal",
		};
	}

	return { submitted: false };
}
