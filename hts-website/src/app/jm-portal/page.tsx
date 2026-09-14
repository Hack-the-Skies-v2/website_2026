import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import JMPortal from "./JMPortal";

export default async function JMPortalPage() {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) redirect("/auth");

	const [{ data: profile }, { data: application }] = await Promise.all([
		supabase
			.from("users")
			.select("judge, mentor")
			.eq("id", user.id)
			.maybeSingle(),
		supabase
			.from("applications")
			.select("application_type, status")
			.eq("user_id", user.id)
			.maybeSingle(),
	]);

	const isJudge = Boolean(
		profile?.judge || application?.application_type === "judge",
	);
	const isMentor = Boolean(
		profile?.mentor || application?.application_type === "mentor",
	);

	const role: "Judge" | "Mentor" | "Judge & Mentor" =
		isJudge && isMentor
			? "Judge & Mentor"
			: isJudge
				? "Judge"
				: isMentor
					? "Mentor"
					: "Judge & Mentor";

	return (
		<JMPortal
			name={user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? role}
			email={user.email ?? ""}
			role={role}
			isJudge={isJudge}
		/>
	);
}
