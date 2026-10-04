"use server";

import { z } from "zod";
import { requireOrganizer } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

const checkInSchema = z.object({
    qrCode: z.string().url().max(1000),
    eventId: z.uuid(),
});

const qrCodeSchema = z.object({ qrCode: z.string().url().max(1000) });

type ScannedPerson = {
    name: string;
    role: "Hacker" | "Judge" | "Mentor";
    pronouns: string[];
    pronounsOther: string;
    dietaryRestrictions: string[];
    dietaryOther: string;
    accessibilityAccommodations: string[];
    accessibilityOther: string;
};

type AdminResult<T> = { success: true; data: T } | { success: false; error: string };

function adminError(error: unknown, fallback: string): AdminResult<never> {
    return { success: false, error: error instanceof Error ? error.message : fallback };
}

async function findUserByQrCode(qrCode: string) {
    const supabase = createAdminClient();
    const { data: user, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("qr_code_link", qrCode)
        .maybeSingle();
    if (userError || !user) throw new Error("That QR code was not recognized.");

    const { data: application, error: applicationError } = await supabase
        .from("applications")
        .select("application_type, type")
        .eq("user_id", user.id)
        .maybeSingle();
    if (applicationError || !application) throw new Error("No application was found for that QR code.");

    const type = (application.application_type ?? application.type)?.toLowerCase();
    if (!type) throw new Error("No application role was found for that QR code.");

    return { supabase, userId: user.id, type };
}

async function awardCheckInPoints(
    supabase: ReturnType<typeof createAdminClient>,
    userId: string,
    eventType: string,
) {
    const { data: actions, error: actionsError } = await supabase
        .from("point_actions")
        .select("id, name, active")
        .in("name", ["Check in", "Referral", "Attend a workshop"]);
    if (actionsError) throw new Error(`Check-in was recorded, but point actions could not be loaded: ${actionsError.message}`);

    const checkInAction = actions?.find((action) => action.name === "Check in");
    const referralAction = actions?.find((action) => action.name === "Referral");
    const workshopAction = actions?.find((action) => action.name === "Attend a workshop");
    if (!checkInAction || !referralAction || (eventType === "workshop" && !workshopAction)) {
        throw new Error("Check-in was recorded, but a required point action is missing. Apply the point action migration.");
    }

    const { count: checkInEarningCount, error: checkInCountError } = await supabase
        .from("point_earnings")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("point_action_id", checkInAction.id);
    if (checkInCountError) throw new Error(`Check-in was recorded, but its points could not be verified: ${checkInCountError.message}`);

    if (!checkInEarningCount) {
        const { error } = await supabase.from("point_earnings").insert({
            user_id: userId,
            point_action_id: checkInAction.id,
        });
        if (error) throw new Error(`Check-in was recorded, but its points could not be awarded: ${error.message}`);
    }

    if (eventType === "workshop" && workshopAction) {
        const { error } = await supabase.from("point_earnings").insert({
            user_id: userId,
            point_action_id: workshopAction.id,
        });
        if (error) throw new Error(`Check-in was recorded, but workshop points could not be awarded: ${error.message}`);
    }

    const { data: referral, error: referralError } = await supabase
        .from("referrals")
        .select("referrer_user_id")
        .eq("referred_user_id", userId)
        .maybeSingle();
    if (referralError) throw new Error(`Check-in points were awarded, but the referral could not be checked: ${referralError.message}`);

    if (!referral) return;

    const { error } = await supabase.from("point_earnings").insert({
        user_id: referral.referrer_user_id,
        point_action_id: referralAction.id,
    });
    if (error) throw new Error(`Check-in points were awarded, but the referral bonus could not be awarded: ${error.message}`);
}

export async function lookupQrCode(input: unknown): Promise<AdminResult<ScannedPerson>> {
    try {
        await requireOrganizer();
        const parsed = qrCodeSchema.safeParse(input);
        if (!parsed.success) return { success: false, error: "Invalid QR code." };

        const { supabase, userId, type } = await findUserByQrCode(parsed.data.qrCode);
    if (type === "hacker") {
        const { data, error } = await supabase
            .from("hacker_applications")
            .select("first_name, last_name, preferred_name, pronouns, pronouns_other, dietary_restrictions, dietary_other, accessibility_accommodations, accessibility_other")
            .eq("user_id", userId)
            .maybeSingle();
        if (error || !data) return { success: false, error: error?.message ?? "The hacker application could not be found." };
        return { success: true, data: {
            name: data.preferred_name?.trim() || `${data.first_name} ${data.last_name}`,
            role: "Hacker",
            pronouns: data.pronouns ?? [],
            pronounsOther: data.pronouns_other ?? "",
            dietaryRestrictions: data.dietary_restrictions ?? [],
            dietaryOther: data.dietary_other ?? "",
            accessibilityAccommodations: data.accessibility_accommodations ?? [],
            accessibilityOther: data.accessibility_other ?? "",
        } };
    }

    if (type === "judge") {
        const { data, error } = await supabase
            .from("judge_applications")
            .select("name")
            .eq("user_id", userId)
            .maybeSingle();
        if (error || !data) return { success: false, error: error?.message ?? "The judge application could not be found." };
        return { success: true, data: {
            name: data.name,
            role: "Judge",
            pronouns: [],
            pronounsOther: "",
            dietaryRestrictions: [],
            dietaryOther: "",
            accessibilityAccommodations: [],
            accessibilityOther: "",
        } };
    }

    if (type === "mentor") {
        const { data, error } = await supabase
            .from("mentor_applications")
            .select("name")
            .eq("user_id", userId)
            .maybeSingle();
        if (error || !data) return { success: false, error: error?.message ?? "The mentor application could not be found." };
        return { success: true, data: {
            name: data.name,
            role: "Mentor",
            pronouns: [],
            pronounsOther: "",
            dietaryRestrictions: [],
            dietaryOther: "",
            accessibilityAccommodations: [],
            accessibilityOther: "",
        } };
    }

        return { success: false, error: "That application type is not supported." };
    } catch (error) {
        return adminError(error, "Could not read this QR code.");
    }
}

export async function checkInByQrCode(input: unknown): Promise<AdminResult<{ eventTitle: string }>> {
    try {
    await requireOrganizer();
    const parsed = checkInSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: "Invalid QR code or event." };

    const { supabase, userId } = await findUserByQrCode(parsed.data.qrCode);
    const { data: event, error: eventError } = await supabase
        .from("schedule_events")
        .select("id, title, type")
        .eq("id", parsed.data.eventId)
        .maybeSingle();
    if (eventError || !event) throw new Error("That event could not be found.");

    const { error: attendanceError } = await supabase.from("schedule_attendance").insert({
        event_id: event.id,
        user_id: userId,
    });

    if (attendanceError?.code === "23505") {
        return { success: false, error: `Already checked in for ${event.title}.` };
    }
    if (attendanceError) throw new Error("Could not record the check-in.");

    await awardCheckInPoints(supabase, userId, event.type);

    return { success: true, data: { eventTitle: event.title } };
    } catch (error) {
        return adminError(error, "Could not check in this user.");
    }
}