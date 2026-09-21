"use server";

import { createClient } from "@/lib/supabase/server";

function stripHtml(value: string): string {
	return value.replace(/<[^>]*>/g, "");
}

function sanitize(val: unknown, maxLen = 2000): string {
	if (typeof val !== "string") return "";
	return stripHtml(val).trim().slice(0, maxLen);
}

function sanitizeArray(val: unknown, maxLen = 200): string[] {
	if (!Array.isArray(val)) return [];
	return val
		.filter((v): v is string => typeof v === "string")
		.map((v) => sanitize(v, maxLen));
}

export async function saveDraftHackerApplication(data: {
	section1?: Record<string, unknown>;
	section2?: Record<string, unknown>;
	section3?: Record<string, unknown>;
	section4?: Record<string, unknown>;
	section5?: Record<string, unknown>;
}) {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return { success: false, error: "You must be signed in." };
	}

	const s1 = data.section1 ?? {};
	const s2 = data.section2 ?? {};
	const s3 = data.section3 ?? {};
	const s4 = data.section4 ?? {};
	const s5 = data.section5 ?? {};

	const questions = Array.isArray(s3.applicationQuestions) ? s3.applicationQuestions : [];
	const resumePath = sanitize(s4.resumePath, 300);
	const ownsResume = resumePath.startsWith(`${user.id}/`);

	const draft = {
		user_id: user.id,
		first_name: sanitize(s1.firstName, 200) || null,
		last_name: sanitize(s1.lastName, 200) || null,
		preferred_name: sanitize(s1.preferredName, 200) || null,
		pronouns: sanitizeArray(s1.pronouns),
		pronouns_other: sanitize(s1.pronounsOther, 500) || null,
		grade: sanitize(s1.grade, 50) || null,
		email: sanitize(s1.email, 320) || null,
		teammates: sanitizeArray(s1.teammates).filter(Boolean),
		phone_number: null,
		date_of_birth: null,
		t_shirt_size: null,
		city: null,
		province: null,
		dietary_restrictions: sanitizeArray(s1.dietaryRestrictions),
		dietary_other: sanitize(s1.dietaryOther, 500) || null,
		accessibility_accommodations: sanitizeArray(s1.accessibilityAccommodations),
		accessibility_other: sanitize(s1.accessibilityOther, 500) || null,
		heard_about_hts: sanitize(s1.heardAboutHTS, 200) || null,
		heard_about_hts_other: sanitize(s1.heardAboutHTSOther, 500) || null,
		school_name: sanitize(s2.schoolName, 200) || null,
		graduation_year: null,
		school_city: null,
		coding_experience: sanitize(s2.codingExperience, 200) || null,
		goals: sanitizeArray(s2.goals),
		goals_other: sanitize(s2.goalsOther, 500) || null,
		want_to_see: sanitize(s2.wantToSee, 1000) || null,
		favourite_song: sanitize(s2.favouriteSong, 200) || null,
		application_questions_1: sanitize(questions[0], 5000) || null,
		application_questions_2: sanitize(questions[1], 5000) || null,
		resume_path: ownsResume ? resumePath : null,
		resume_name: ownsResume ? sanitize(s4.resumeName, 200) || null : null,
		linkedin_portfolio: sanitize(s4.linkedinPortfolio, 500) || null,
		github_devpost: sanitize(s4.githubDevpost, 500) || null,
		other_comments: sanitize(s4.otherComments, 2000) || null,
		eligibility_confirm: typeof s5.eligibilityConfirm === "boolean" ? s5.eligibilityConfirm : null,
		information_confirm: typeof s5.informationConfirm === "boolean" ? s5.informationConfirm : null,
		parental_confirm: typeof s5.parentalConfirm === "boolean" ? s5.parentalConfirm : null,
		terms_agreed: typeof s5.termsAgreed === "boolean" ? s5.termsAgreed : null,
		updated_at: new Date().toISOString(),
	};

	const { error } = await supabase
		.from("draft_hacker_applications")
		.upsert(draft, { onConflict: "user_id" });

	if (error) {
		console.error("saveDraftHackerApplication error:", error);
		return { success: false, error: "Unable to save draft right now." };
	}

	return { success: true };
}