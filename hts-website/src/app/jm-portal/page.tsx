import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { HTS_REF_COOKIE, recordReferral } from "@/lib/referral";
import { getApplicationAccess } from "@/lib/applications/access";
import JMPortal from "./JMPortal";

export default async function JMPortalPage() {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) redirect("/auth");

	const cookieStore = await cookies();
	const cookieRef = cookieStore.get(HTS_REF_COOKIE)?.value;
	if (cookieRef) {
		await recordReferral(cookieRef, supabase);
		try {
			cookieStore.delete(HTS_REF_COOKIE);
		} catch {}
	}

	const access = await getApplicationAccess(supabase, user.id);
	const { isJudge, isMentor } = access;

	if (!isJudge && !isMentor) redirect("/apply");

	const role: "Judge" | "Mentor" | "Judge & Mentor" =
		isJudge && isMentor
			? "Judge & Mentor"
			: isJudge
				? "Judge"
				: "Mentor";

	return (
		<JMPortal
			name={user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? role}
			email={user.email ?? ""}
			role={role}
			isJudge={isJudge}
			status={access.applicationStatus ?? "pending"}
		/>
	);
}

