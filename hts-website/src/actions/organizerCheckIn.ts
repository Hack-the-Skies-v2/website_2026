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

export async function lookupQrCode(input: unknown): Promise<ScannedPerson> {
    await requireOrganizer();
    const parsed = qrCodeSchema.safeParse(input);
    if (!parsed.success) throw new Error("Invalid QR code.");

    const { supabase, userId, type } = await findUserByQrCode(parsed.data.qrCode);
    if (type === "hacker") {
        const { data, error } = await supabase
            .from("hacker_applications")
            .select("first_name, last_name, preferred_name, pronouns, pronouns_other, dietary_restrictions, dietary_other, accessibility_accommodations, accessibility_other")
            .eq("user_id", userId)
            .maybeSingle();
        if (error || !data) throw new Error("The hacker application could not be found.");
        return {
            name: `${data.first_name} ${data.last_name}`,
            role: "Hacker",
            pronouns: data.pronouns ?? [],
            pronounsOther: data.pronouns_other ?? "",
            dietaryRestrictions: data.dietary_restrictions ?? [],
            dietaryOther: data.dietary_other ?? "",
            accessibilityAccommodations: data.accessibility_accommodations ?? [],
            accessibilityOther: data.accessibility_other ?? "",
        };
    }

    if (type === "judge") {
        const { data, error } = await supabase
            .from("judge_applications")
            .select("name")
            .eq("user_id", userId)
            .maybeSingle();
        if (error || !data) throw new Error("The judge application could not be found.");
        return {
            name: data.name,
            role: "Judge",
            pronouns: [],
            pronounsOther: "",
            dietaryRestrictions: [],
            dietaryOther: "",
            accessibilityAccommodations: [],
            accessibilityOther: "",
        };
    }

    if (type === "mentor") {
        const { data, error } = await supabase
            .from("mentor_applications")
            .select("name")
            .eq("user_id", userId)
            .maybeSingle();
        if (error || !data) throw new Error("The mentor application could not be found.");
        return {
            name: data.name,
            role: "Mentor",
            pronouns: [],
            pronounsOther: "",
            dietaryRestrictions: [],
            dietaryOther: "",
            accessibilityAccommodations: [],
            accessibilityOther: "",
        };
    }

    throw new Error("That application type is not supported.");
}

export async function checkInByQrCode(input: unknown) {
    await requireOrganizer();
    const parsed = checkInSchema.safeParse(input);
    if (!parsed.success) throw new Error("Invalid QR code or event.");

    const { supabase, userId } = await findUserByQrCode(parsed.data.qrCode);
    const { data: event, error: eventError } = await supabase
        .from("schedule_events")
        .select("id, title")
        .eq("id", parsed.data.eventId)
        .maybeSingle();
    if (eventError || !event) throw new Error("That event could not be found.");

    const { error: attendanceError } = await supabase.from("schedule_attendance").insert({
        event_id: event.id,
        user_id: userId,
    });

    if (attendanceError?.code === "23505") {
        throw new Error(`Already checked in for ${event.title}.`);
    }
    if (attendanceError) throw new Error("Could not record the check-in.");

    const { error: userUpdateError } = await supabase
        .from("users")
        .update({ checked_in: true })
        .eq("id", userId);
    if (userUpdateError) throw new Error("Check-in was recorded, but the user status could not be updated.");

    return { eventTitle: event.title };
}