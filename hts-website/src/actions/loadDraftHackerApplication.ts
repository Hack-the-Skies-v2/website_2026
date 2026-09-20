"use server";

import { createClient } from "@/lib/supabase/server";

export type DraftHackerData = {
	section1: {
		role: "Hacker";
		firstName: string;
		lastName: string;
		preferredName: string;
		pronouns: string[];
		pronounsOther: string;
		grade: string;
		email: string;
		phoneNumber: string;
		dateOfBirth: string;
		tShirtSize: string;
		city: string;
		province: string;
		dietaryRestrictions: string[];
		dietaryOther: string;
		accessibilityAccommodations: string[];
		accessibilityOther: string;
	};
	section2: {
		schoolName: string;
		graduationYear: string;
		schoolCity: string;
	};
	section3: {
		parentName: string;
		parentEmail: string;
		parentPhone: string;
		emergencyContactName: string;
		emergencyContactPhone: string;
		emergencyContactRelationship: string;
		emergencyContactRelationshipOther: string;
	};
	section4: {
		hackathonExperience: string;
		heardAboutHTS: string;
		heardAboutHTSOther: string;
	};
	section5: {
		applicationQuestions: string[];
	};
	section6: {
		eligibilityConfirm: boolean;
		informationConfirm: boolean;
		parentalConfirm: boolean;
		termsAgreed: boolean;
	};
} | null;

export async function loadDraftHackerApplication(): Promise<DraftHackerData> {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) return null;

	const { data: draft, error } = await supabase
		.from("draft_hacker_applications")
		.select("*")
		.eq("user_id", user.id)
		.maybeSingle();

	if (error || !draft) return null;

	return {
		section1: {
			role: "Hacker",
			firstName: draft.first_name ?? "",
			lastName: draft.last_name ?? "",
			preferredName: draft.preferred_name ?? "",
			pronouns: draft.pronouns ?? [],
			pronounsOther: draft.pronouns_other ?? "",
			grade: draft.grade ?? "",
			email: draft.email ?? "",
			phoneNumber: draft.phone_number ?? "",
			dateOfBirth: draft.date_of_birth ?? "",
			tShirtSize: draft.t_shirt_size ?? "",
			city: draft.city ?? "",
			province: draft.province ?? "",
			dietaryRestrictions: draft.dietary_restrictions ?? [],
			dietaryOther: draft.dietary_other ?? "",
			accessibilityAccommodations: draft.accessibility_accommodations ?? [],
			accessibilityOther: draft.accessibility_other ?? "",
		},
		section2: {
			schoolName: draft.school_name ?? "",
			graduationYear: draft.graduation_year ?? "",
			schoolCity: draft.school_city ?? "",
		},
		section3: {
			parentName: draft.parent_name ?? "",
			parentEmail: draft.parent_email ?? "",
			parentPhone: draft.parent_phone ?? "",
			emergencyContactName: draft.emergency_contact_name ?? "",
			emergencyContactPhone: draft.emergency_contact_phone ?? "",
			emergencyContactRelationship: draft.emergency_contact_relationship ?? "",
			emergencyContactRelationshipOther: draft.emergency_contact_relationship_other ?? "",
		},
		section4: {
			hackathonExperience: draft.hackathon_experience ?? "",
			heardAboutHTS: draft.heard_about_hts ?? "",
			heardAboutHTSOther: draft.heard_about_hts_other ?? "",
		},
		section5: {
			applicationQuestions: [
				draft.application_questions_1 ?? "",
				draft.application_questions_2 ?? "",
				draft.application_questions_3 ?? "",
				draft.application_questions_4 ?? "",
				draft.application_questions_5 ?? "",
			],
		},
		section6: {
			eligibilityConfirm: draft.eligibility_confirm ?? false,
			informationConfirm: draft.information_confirm ?? false,
			parentalConfirm: draft.parental_confirm ?? false,
			termsAgreed: draft.terms_agreed ?? false,
		},
	};
}
