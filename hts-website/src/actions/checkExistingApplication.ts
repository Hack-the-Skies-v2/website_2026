"use server";

import { createClient } from "@/lib/supabase/server";
import { getApplicationAccess } from "@/lib/applications/access";

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

	const access = await getApplicationAccess(supabase, user.id);

	if (access.isJudge || access.isMentor) {
		return {
			submitted: true,
			role: access.isJudge ? "judge" : "mentor",
			redirectUrl: "/jm-portal",
		};
	}

	if (access.isHacker) {
		return {
			submitted: true,
			role: "hacker",
			redirectUrl: "/portal",
		};
	}

	return { submitted: false };
}
