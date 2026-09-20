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
	section6?: Record<string, unknown>;
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
	const s6 = data.section6 ?? {};

	const questions = Array.isArray(s5.applicationQuestions) ? s5.applicationQuestions : [];

	const draft = {
		user_id: user.id,
		first_name: sanitize(s1.firstName, 200) || null,
		last_name: sanitize(s1.lastName, 200) || null,
		preferred_name: sanitize(s1.preferredName, 200) || null,
		pronouns: sanitizeArray(s1.pronouns),
		pronouns_other: sanitize(s1.pronounsOther, 500) || null,
		grade: sanitize(s1.grade, 50) || null,
		email: sanitize(s1.email, 320) || null,
		phone_number: sanitize(s1.phoneNumber, 50) || null,
		date_of_birth: typeof s1.dateOfBirth === "string" && s1.dateOfBirth ? s1.dateOfBirth : null,
		t_shirt_size: sanitize(s1.tShirtSize, 20) || null,
		city: sanitize(s1.city, 200) || null,
		province: sanitize(s1.province, 200) || null,
		dietary_restrictions: sanitizeArray(s1.dietaryRestrictions),
		dietary_other: sanitize(s1.dietaryOther, 500) || null,
		accessibility_accommodations: sanitizeArray(s1.accessibilityAccommodations),
		accessibility_other: sanitize(s1.accessibilityOther, 500) || null,
		school_name: sanitize(s2.schoolName, 200) || null,
		graduation_year: sanitize(s2.graduationYear, 10) || null,
		school_city: sanitize(s2.schoolCity, 200) || null,
		parent_name: sanitize(s3.parentName, 200) || null,
		parent_email: sanitize(s3.parentEmail, 320) || null,
		parent_phone: sanitize(s3.parentPhone, 50) || null,
		emergency_contact_name: sanitize(s3.emergencyContactName, 200) || null,
		emergency_contact_phone: sanitize(s3.emergencyContactPhone, 50) || null,
		emergency_contact_relationship: sanitize(s3.emergencyContactRelationship, 200) || null,
		emergency_contact_relationship_other: sanitize(s3.emergencyContactRelationshipOther, 500) || null,
		hackathon_experience: sanitize(s4.hackathonExperience, 200) || null,
		heard_about_hts: sanitize(s4.heardAboutHTS, 200) || null,
		heard_about_hts_other: sanitize(s4.heardAboutHTSOther, 500) || null,
		application_questions_1: sanitize(questions[0], 5000) || null,
		application_questions_2: sanitize(questions[1], 5000) || null,
		application_questions_3: sanitize(questions[2], 5000) || null,
		application_questions_4: sanitize(questions[3], 5000) || null,
		application_questions_5: sanitize(questions[4], 5000) || null,
		eligibility_confirm: typeof s6.eligibilityConfirm === "boolean" ? s6.eligibilityConfirm : null,
		information_confirm: typeof s6.informationConfirm === "boolean" ? s6.informationConfirm : null,
		parental_confirm: typeof s6.parentalConfirm === "boolean" ? s6.parentalConfirm : null,
		terms_agreed: typeof s6.termsAgreed === "boolean" ? s6.termsAgreed : null,
		updated_at: new Date().toISOString(),
	};

	const { error } = await supabase
		.from("draft_hacker_applications")
		.upsert(draft, { onConflict: "user_id" });

	if (error) {
		return { success: false, error: error.message };
	}

	return { success: true };
}
