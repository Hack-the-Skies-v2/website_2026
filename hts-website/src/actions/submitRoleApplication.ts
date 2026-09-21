"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const baseSchema = z.object({
    name: z.string().trim().min(1).max(200),
    areas: z.array(z.string().trim().min(1)).min(1),
    termsAgreed: z.literal("true"),
    eligibilityConfirmed: z.literal("true"),
    informationConfirmed: z.literal("true"),
    participationConfirmed: z.literal("true"),
});

const judgeSchema = baseSchema.extend({
    role: z.literal("Judge"),
    companyOrganization: z.string().trim().min(1).max(200),
    jobTitle: z.string().trim().min(1).max(200),
    linkedinUrl: z.string().trim().max(500),
    industryField: z.string().trim().min(1).max(200),
    yearsOfExperience: z.string().trim().min(1),
    strongProjectDescription: z.string().trim().min(1).max(5000),
    professionalBackground: z.string().trim().min(1).max(5000),
    judgingExperience: z.string().trim().min(1).max(5000),
    availableForFullJudgingPeriod: z.enum(["Yes", "No"]),
});

const mentorSchema = baseSchema.extend({
    role: z.literal("Mentor"),
    universityCollege: z.string().trim().min(1).max(200),
    programAndYear: z.string().trim().min(1).max(200),
    linkedinPortfolioGithub: z.string().trim().max(500),
    technologiesAndTools: z.string().trim().min(1).max(5000),
    mentoringExperience: z.string().trim().min(1).max(5000),
    mentoringGoals: z.string().trim().min(1).max(5000),
    availableForFullEvent: z.enum(["Yes", "No"]),
    timesUnavailable: z.string().trim().max(2000),
});

export type RoleApplicationState = {
    success: boolean;
    error?: string;
};

const initialState: RoleApplicationState = { success: false };

function formDataToObject(formData: FormData) {
    return {
        role: formData.get("role"),
        name: formData.get("name"),
        companyOrganization: formData.get("companyOrganization") ?? "",
        jobTitle: formData.get("jobTitle") ?? "",
        linkedinUrl: formData.get("linkedinUrl") ?? "",
        industryField: formData.get("industryField") ?? "",
        yearsOfExperience: formData.get("yearsOfExperience") ?? "",
        strongProjectDescription: formData.get("strongProjectDescription") ?? "",
        professionalBackground: formData.get("professionalBackground") ?? "",
        judgingExperience: formData.get("judgingExperience") ?? "",
        availableForFullJudgingPeriod: formData.get("availableForFullJudgingPeriod") ?? "",
        universityCollege: formData.get("universityCollege") ?? "",
        programAndYear: formData.get("programAndYear") ?? "",
        linkedinPortfolioGithub: formData.get("linkedinPortfolioGithub") ?? "",
        technologiesAndTools: formData.get("technologiesAndTools") ?? "",
        mentoringExperience: formData.get("mentoringExperience") ?? "",
        mentoringGoals: formData.get("mentoringGoals") ?? "",
        availableForFullEvent: formData.get("availableForFullEvent") ?? "",
        timesUnavailable: formData.get("timesUnavailable") ?? "",
        areas: formData.getAll("areas"),
        termsAgreed: formData.get("termsAgreed"),
        eligibilityConfirmed: formData.get("eligibilityConfirmed"),
        informationConfirmed: formData.get("informationConfirmed"),
        participationConfirmed: formData.get("participationConfirmed"),
    };
}

export async function submitRoleApplication(
    _previousState: RoleApplicationState = initialState,
    formData: FormData,
): Promise<RoleApplicationState> {
    const values = formDataToObject(formData);
    const result = values.role === "Judge"
        ? judgeSchema.safeParse(values)
        : values.role === "Mentor"
            ? mentorSchema.safeParse(values)
            : { success: false as const, error: { issues: [{ message: "Choose a valid application type." }] } };

    if (!result.success) {
        return { success: false, error: result.error.issues[0]?.message ?? "Please check your application." };
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.email) return { success: false, error: "You must be signed in to submit an application." };

    try {
        const { error } = await supabase.rpc("submit_role_application", {
            p_application_type: result.data.role.toLowerCase(),
            p_data: result.data,
        });

        if (error) {
            console.error("submit_role_application RPC error:", error);
            if (error.code === "23505") return { success: false, error: "You have already submitted this application." };
            return { success: false, error: "Unable to submit your application right now. Please try again." };
        }
    } catch (err) {
        console.error("submitRoleApplication caught error:", err);
        return { success: false, error: "Unable to submit your application right now. Please try again." };
    }

    return { success: true };
}