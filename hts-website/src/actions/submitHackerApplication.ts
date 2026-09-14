"use server";

import { createClient } from "@/lib/supabase/server";

export async function submitHackerApplication(data: any) {
    return { success: false, error: "Hacker applications are currently closed." };

    // const supabase = await createClient();
    // const {
    // 	data: { user },
    // } = await supabase.auth.getUser();

    // if (!user) {
    // 	return { success: false, error: "You must be signed in to submit an application." };
    // }

    // try {
    // 	const { error: appError } = await supabase.from("applications").upsert({
    // 		user_id: user.id,
    // 		application_type: "hacker",
    // 		status: "pending",
    // 	});

    // 	if (appError) {
    // 		console.error("Error inserting application:", appError);
    // 		return { success: false, error: appError.message };
    // 	}

    // 	const s1 = data.section1;
    // 	const s2 = data.section2;
    // 	const s3 = data.section3;
    // 	const s4 = data.section4;
    // 	const s5 = data.section5;
    // 	const s6 = data.section6;

    // 	const { error: hackerError } = await supabase.from("hacker_applications").upsert({
    // 		user_id: user.id,
    // 		first_name: s1.firstName,
    // 		last_name: s1.lastName,
    // 		preferred_name: s1.preferredName || s1.firstName,
    // 		phone_number: s1.phoneNumber,
    // 		date_of_birth: s1.dateOfBirth,
    // 		t_shirt_size: s1.tShirtSize,
    // 		city: s1.city,
    // 		province: s1.province,
    // 		dietary_restrictions: s1.dietaryRestrictions ?? [],
    // 		dietary_other: s1.dietaryOther ?? "",
    // 		accessibility_accommodations: s1.accessibilityAccommodations ?? [],
    // 		accessibility_other: s1.accessibilityOther ?? "",
    // 		school_name: s2.schoolName,
    // 		grade: s2.grade,
    // 		graduation_year: s2.graduationYear,
    // 		school_city: s2.schoolCity,
    // 		parent_name: s3.parentName,
    // 		parent_email: s3.parentEmail,
    // 		parent_phone: s3.parentPhone,
    // 		emergency_contact_name: s3.emergencyContactName,
    // 		emergency_contact_phone: s3.emergencyContactPhone,
    // 		emergency_contact_relationship: s3.emergencyContactRelationship,
    // 		emergency_contact_relationship_other: s3.emergencyContactRelationshipOther ?? "",
    // 		hackathon_experience: s4.hackathonExperience,
    // 		heard_about_hts: s4.heardAboutHTS,
    // 		heard_about_hts_other: s4.heardAboutHTSOther ?? "",
    // 		application_questions_1: s5.applicationQuestions?.[0] ?? "",
    // 		application_questions_2: s5.applicationQuestions?.[1] ?? "",
    // 		application_questions_3: s5.applicationQuestions?.[2] ?? "",
    // 		application_questions_4: s5.applicationQuestions?.[3] ?? "",
    // 		application_questions_5: s5.applicationQuestions?.[4] ?? "",
    // 		eligibility_confirm: Boolean(s6.eligibilityConfirm),
    // 		information_confirm: Boolean(s6.informationConfirm),
    // 		parental_confirm: Boolean(s6.parentalConfirm),
    // 		terms_agreed: Boolean(s6.termsAgreed),
    // 	});

    // 	if (hackerError) {
    // 		console.error("Error inserting hacker_application:", hackerError);
    // 		return { success: false, error: hackerError.message };
    // 	}

    // 	return { success: true };
    // } catch (err: any) {
    // 	console.error("Submission failed:", err);
    // 	return { success: false, error: err?.message || "Failed to submit application." };
    // }
}
