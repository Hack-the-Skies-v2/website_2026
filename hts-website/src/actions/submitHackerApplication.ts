"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

function stripHtml(value: string): string {
	return value.replace(/<[^>]*>/g, "");
}

const hackerSchema = z.object({
	section1: z.object({
		firstName: z.string().trim().min(1, "First name is required").max(200).transform(stripHtml),
		lastName: z.string().trim().min(1, "Last name is required").max(200).transform(stripHtml),
		preferredName: z.string().trim().max(200).transform(stripHtml),
		pronouns: z.array(z.string().trim().max(200).transform(stripHtml)),
		pronounsOther: z.string().trim().max(500).transform(stripHtml).default(""),	
		grade: z.string().trim().max(200).transform(stripHtml),
		phoneNumber: z.string().trim().min(1, "Phone number is required").max(50).transform(stripHtml),
		email: z.string().trim().min(1, "Email is required").max(320).email("Invalid email").transform(stripHtml),
		dateOfBirth: z.string().trim().min(1, "Date of birth is required"),
		tShirtSize: z.string().trim().min(1, "T-shirt size is required").max(20).transform(stripHtml),
		city: z.string().trim().min(1, "City is required").max(200).transform(stripHtml),
		province: z.string().trim().min(1, "Province is required").max(200).transform(stripHtml),
		dietaryRestrictions: z.array(z.string().trim().max(200).transform(stripHtml)),
		dietaryOther: z.string().trim().max(500).transform(stripHtml).default(""),
		accessibilityAccommodations: z.array(z.string().trim().max(200).transform(stripHtml)),
		accessibilityOther: z.string().trim().max(500).transform(stripHtml).default(""),
	}),
	section2: z.object({
		schoolName: z.string().trim().min(1, "School name is required").max(200).transform(stripHtml),
		graduationYear: z.string().trim().min(1, "Graduation year is required").max(10).transform(stripHtml),
		schoolCity: z.string().trim().min(1, "School city is required").max(200).transform(stripHtml),
	}),
	section3: z.object({
		parentName: z.string().trim().min(1, "Parent name is required").max(200).transform(stripHtml),
		parentEmail: z.string().trim().min(1, "Parent email is required").max(320).email("Invalid email").transform(stripHtml),
		parentPhone: z.string().trim().min(1, "Parent phone is required").max(50).transform(stripHtml),
		emergencyContactName: z.string().trim().min(1, "Emergency contact name is required").max(200).transform(stripHtml),
		emergencyContactPhone: z.string().trim().min(1, "Emergency contact phone is required").max(50).transform(stripHtml),
		emergencyContactRelationship: z.string().trim().min(1, "Relationship is required").max(200).transform(stripHtml),
		emergencyContactRelationshipOther: z.string().trim().max(500).transform(stripHtml).default(""),
	}),
	section4: z.object({
		hackathonExperience: z.string().trim().min(1, "Hackathon experience is required").max(200).transform(stripHtml),
		heardAboutHTS: z.string().trim().min(1, "This field is required").max(200).transform(stripHtml),
		heardAboutHTSOther: z.string().trim().max(500).transform(stripHtml).default(""),
	}),
	section5: z.object({
		applicationQuestions: z.array(z.string().trim().max(5000).transform(stripHtml)).length(5),
	}),
	section6: z.object({
		eligibilityConfirm: z.literal(true, { message: "You must confirm eligibility" }),
		informationConfirm: z.literal(true, { message: "You must confirm information accuracy" }),
		parentalConfirm: z.literal(true, { message: "You must confirm parental understanding" }),
		termsAgreed: z.literal(true, { message: "You must agree to the terms" }),
	}),
});

const refCodeSchema = z
	.string()
	.min(1)
	.max(32)
	.regex(/^[A-Za-z0-9+/=_-]+$/);

export async function submitHackerApplication(data: unknown) {
	const result = hackerSchema.safeParse(data);

	if (!result.success) {
		return {
			success: false,
			error: result.error.issues[0]?.message ?? "Please check your application.",
		};
	}

	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return { success: false, error: "You must be signed in to submit an application." };
	}

	const d = result.data;

	try {
		const { error } = await supabase.rpc("submit_hacker_application", {
			p_data: {
				firstName: d.section1.firstName,
				lastName: d.section1.lastName,
				preferredName: d.section1.preferredName || d.section1.firstName,
				pronouns: d.section1.pronouns,
				pronounsOther: d.section1.pronounsOther,
				grade: d.section1.grade,
				email: d.section1.email,
				phoneNumber: d.section1.phoneNumber,
				dateOfBirth: d.section1.dateOfBirth,
				tShirtSize: d.section1.tShirtSize,
				city: d.section1.city,
				province: d.section1.province,
				dietaryRestrictions: d.section1.dietaryRestrictions,
				dietaryOther: d.section1.dietaryOther,
				accessibilityAccommodations: d.section1.accessibilityAccommodations,
				accessibilityOther: d.section1.accessibilityOther,
				schoolName: d.section2.schoolName,
				graduationYear: d.section2.graduationYear,
				schoolCity: d.section2.schoolCity,
				parentName: d.section3.parentName,
				parentEmail: d.section3.parentEmail,
				parentPhone: d.section3.parentPhone,
				emergencyContactName: d.section3.emergencyContactName,
				emergencyContactPhone: d.section3.emergencyContactPhone,
				emergencyContactRelationship: d.section3.emergencyContactRelationship,
				emergencyContactRelationshipOther: d.section3.emergencyContactRelationshipOther,
				hackathonExperience: d.section4.hackathonExperience,
				heardAboutHTS: d.section4.heardAboutHTS,
				heardAboutHTSOther: d.section4.heardAboutHTSOther,
				applicationQuestions1: d.section5.applicationQuestions[0] ?? "",
				applicationQuestions2: d.section5.applicationQuestions[1] ?? "",
				applicationQuestions3: d.section5.applicationQuestions[2] ?? "",
				applicationQuestions4: d.section5.applicationQuestions[3] ?? "",
				applicationQuestions5: d.section5.applicationQuestions[4] ?? "",
				eligibilityConfirm: d.section6.eligibilityConfirm,
				informationConfirm: d.section6.informationConfirm,
				parentalConfirm: d.section6.parentalConfirm,
				termsAgreed: d.section6.termsAgreed,
			},
		});

		if (error) {
			if (error.code === "23505") {
				return { success: false, error: "You have already submitted an application." };
			}
			return { success: false, error: error.message };
		}
	} catch {
		return { success: false, error: "Unable to submit your application right now." };
	}

	const cookieStore = await cookies();
	const rawRef = cookieStore.get("hts_ref")?.value;

	cookieStore.delete("hts_ref");
	cookieStore.set("hts_ref", "", {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax",
		path: "/",
		maxAge: 0,
	});

	if (rawRef) {
		const refResult = refCodeSchema.safeParse(rawRef);
		if (refResult.success) {
			try {
				await supabase.rpc("record_referral", { p_code: refResult.data });
			} catch {}
		}
	}

	return { success: true };
}
