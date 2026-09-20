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
		teammates: string[];
		dietaryRestrictions: string[];
		dietaryOther: string;
		accessibilityAccommodations: string[];
		accessibilityOther: string;
		heardAboutHTS: string;
		heardAboutHTSOther: string;
	};
	section2: {
		schoolName: string;
		graduationYear: string;
		schoolCity: string;
		codingExperience: string;
		goals: string[];
		goalsOther: string;
		wantToSee: string;
		favouriteSong: string;
	};
	section3: {
		applicationQuestions: string[];
	};
	section4: {
		resumePath: string;
		resumeName: string;
		linkedinPortfolio: string;
		githubDevpost: string;
		otherComments: string;
	};
	section5: {
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
			teammates: draft.teammates ?? [],
			dietaryRestrictions: draft.dietary_restrictions ?? [],
			dietaryOther: draft.dietary_other ?? "",
			accessibilityAccommodations: draft.accessibility_accommodations ?? [],
			accessibilityOther: draft.accessibility_other ?? "",
			heardAboutHTS: draft.heard_about_hts ?? "",
			heardAboutHTSOther: draft.heard_about_hts_other ?? "",
		},
		section2: {
			schoolName: draft.school_name ?? "",
			graduationYear: draft.graduation_year ?? "",
			schoolCity: draft.school_city ?? "",
			codingExperience: draft.coding_experience ?? "",
			goals: draft.goals ?? [],
			goalsOther: draft.goals_other ?? "",
			wantToSee: draft.want_to_see ?? "",
			favouriteSong: draft.favourite_song ?? "",
		},
		section3: {
			applicationQuestions: [
				draft.application_questions_1 ?? "",
				draft.application_questions_2 ?? "",
			],
		},
		section4: {
			resumePath: draft.resume_path ?? "",
			resumeName: draft.resume_name ?? "",
			linkedinPortfolio: draft.linkedin_portfolio ?? "",
			githubDevpost: draft.github_devpost ?? "",
			otherComments: draft.other_comments ?? "",
		},
		section5: {
			eligibilityConfirm: draft.eligibility_confirm ?? false,
			informationConfirm: draft.information_confirm ?? false,
			parentalConfirm: draft.parental_confirm ?? false,
			termsAgreed: draft.terms_agreed ?? false,
		},
	};
}