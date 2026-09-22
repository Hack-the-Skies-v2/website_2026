"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

function stripHtml(value: string): string {
	return value.replace(/<[^>]*>/g, "");
}

const MAX_TEAMMATES = 4;

const hackerSchema = z.object({
	section1: z.object({
		firstName: z.string().trim().min(1, "First name is required").max(200).transform(stripHtml),
		lastName: z.string().trim().min(1, "Last name is required").max(200).transform(stripHtml),
		preferredName: z.string().trim().max(200).transform(stripHtml),
		pronouns: z.array(z.string().trim().max(200).transform(stripHtml)),
		pronounsOther: z.string().trim().max(500).transform(stripHtml).default(""),
		grade: z.string().trim().max(200).transform(stripHtml),
		email: z.string().trim().min(1, "Email is required").max(320).email("Invalid email").transform(stripHtml),
		teammates: z
			.array(z.string().trim().max(200).transform(stripHtml))
			.transform((names) => names.filter((name) => name.length > 0))
			.pipe(z.array(z.string()).min(1, "Please list your teammates, or write \"None\" if you're applying on your own"))
			.refine(
				(names) => names.filter((name) => name.toLowerCase() !== "none").length <= MAX_TEAMMATES,
				{ message: `Teams can have at most ${MAX_TEAMMATES} teammates in addition to yourself.` }
			),
		dietaryRestrictions: z.array(z.string().trim().max(200).transform(stripHtml)),
		dietaryOther: z.string().trim().max(500).transform(stripHtml).default(""),
		accessibilityAccommodations: z.array(z.string().trim().max(200).transform(stripHtml)),
		accessibilityOther: z.string().trim().max(500).transform(stripHtml).default(""),
		heardAboutHTS: z.string().trim().min(1, "This field is required").max(200).transform(stripHtml),
		heardAboutHTSOther: z.string().trim().max(500).transform(stripHtml).default(""),
	}),
	section2: z.object({
		schoolName: z.string().trim().min(1, "School name is required").max(200).transform(stripHtml),
		codingExperience: z.string().trim().min(1, "Coding experience is required").max(200).transform(stripHtml),
		goals: z.array(z.string().trim().max(200).transform(stripHtml)).min(1, "Please select at least one goal"),
		goalsOther: z.string().trim().max(500).transform(stripHtml).default(""),
		wantToSee: z.string().trim().min(1, "This field is required").max(1000).transform(stripHtml),
		favouriteSong: z.string().trim().min(1, "Favourite song is required").max(200).transform(stripHtml),
	}),
	section3: z.object({
		applicationQuestions: z
			.array(z.string().trim().min(1, "Please answer every application question").max(5000).transform(stripHtml))
			.length(2),
	}),
	section4: z
		.object({
			resumePath: z.string().trim().max(300).transform(stripHtml).default(""),
			resumeName: z.string().trim().max(200).transform(stripHtml).default(""),
			linkedinPortfolio: z.string().trim().max(500).transform(stripHtml).default(""),
			githubDevpost: z.string().trim().max(500).transform(stripHtml).default(""),
			otherComments: z.string().trim().max(2000).transform(stripHtml).default(""),
		})
		.refine((s) => s.resumePath || s.linkedinPortfolio || s.githubDevpost, {
			message: "Please upload a resume or share a LinkedIn / portfolio or GitHub / Devpost link",
		}),
	section5: z.object({
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

	if (d.section4.resumePath && !d.section4.resumePath.startsWith(`${user.id}/`)) {
		return { success: false, error: "Please upload your resume again." };
	}

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
				teammates: d.section1.teammates,
				dietaryRestrictions: d.section1.dietaryRestrictions,
				dietaryOther: d.section1.dietaryOther,
				accessibilityAccommodations: d.section1.accessibilityAccommodations,
				accessibilityOther: d.section1.accessibilityOther,
				heardAboutHTS: d.section1.heardAboutHTS,
				heardAboutHTSOther: d.section1.heardAboutHTSOther,
				schoolName: d.section2.schoolName,
				codingExperience: d.section2.codingExperience,
				goals: d.section2.goals,
				goalsOther: d.section2.goalsOther,
				wantToSee: d.section2.wantToSee,
				favouriteSong: d.section2.favouriteSong,
				applicationQuestions1: d.section3.applicationQuestions[0] ?? "",
				applicationQuestions2: d.section3.applicationQuestions[1] ?? "",
				resumePath: d.section4.resumePath,
				resumeName: d.section4.resumeName,
				linkedinPortfolio: d.section4.linkedinPortfolio,
				githubDevpost: d.section4.githubDevpost,
				otherComments: d.section4.otherComments,
				eligibilityConfirm: d.section5.eligibilityConfirm,
				informationConfirm: d.section5.informationConfirm,
				parentalConfirm: d.section5.parentalConfirm,
				termsAgreed: d.section5.termsAgreed,
			},
		});

		if (error) {
			console.error("submit_hacker_application RPC error:", error);
			if (error.code === "23505") {
				return { success: false, error: "You have already submitted an application." };
			}
			return { success: false, error: "Unable to submit your application right now. Please try again." };
		}
	} catch (err) {
		console.error("submitHackerApplication caught error:", err);
		return { success: false, error: "Unable to submit your application right now. Please try again." };
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