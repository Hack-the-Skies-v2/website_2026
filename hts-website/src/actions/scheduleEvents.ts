"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireOrganizer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const scheduleEventTypes = [
    "workshop",
    "event",
    "meal",
    "ceremony",
    "check_in",
    "activity",
    "other",
] as const;

const eventSchema = z
    .object({
        title: z.string().trim().min(1, "Title is required.").max(200),
        type: z.enum(scheduleEventTypes),
        description: z.string().trim().max(5000),
        startTime: z.string().refine((value) => !Number.isNaN(Date.parse(value)), "Start time is required."),
        endTime: z.string().refine((value) => !Number.isNaN(Date.parse(value)), "End time is required."),
        location: z.string().trim().max(200),
    })
    .refine((value) => new Date(value.endTime) > new Date(value.startTime), {
        message: "End time must be after start time.",
        path: ["endTime"],
    });

const updateSchema = eventSchema.extend({ id: z.uuid() });
type AdminResult = { success: true } | { success: false; error: string };

function eventValues(input: z.infer<typeof eventSchema>) {
    return {
        title: input.title,
        type: input.type,
        description: input.description || null,
        start_time: new Date(input.startTime).toISOString(),
        end_time: new Date(input.endTime).toISOString(),
        location: input.location || null,
        updated_at: new Date().toISOString(),
    };
}

export async function createScheduleEvent(input: unknown): Promise<AdminResult> {
 try {
    await requireOrganizer();
    const parsed = eventSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid event." };

    const supabase = await createClient();
    const { error } = await supabase.from("schedule_events").insert(eventValues(parsed.data));
    if (error) return { success: false, error: `Could not create event: ${error.message}` };

    revalidatePath("/organizers");
    revalidatePath("/portal");
    return { success: true };
 } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Could not create event." };
 }
}

export async function updateScheduleEvent(input: unknown): Promise<AdminResult> {
 try {
    await requireOrganizer();
    const parsed = updateSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid event." };

    const { id, ...values } = parsed.data;
    const supabase = await createClient();
    const { error } = await supabase.from("schedule_events").update(eventValues(values)).eq("id", id);
    if (error) return { success: false, error: `Could not update event: ${error.message}` };

    revalidatePath("/organizers");
    revalidatePath("/portal");
    return { success: true };
 } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Could not update event." };
 }
}

export async function deleteScheduleEvent(id: string): Promise<AdminResult> {
 try {
    await requireOrganizer();
    const parsedId = z.uuid().safeParse(id);
    if (!parsedId.success) return { success: false, error: "Invalid event." };

    const supabase = await createClient();
    const { error } = await supabase.from("schedule_events").delete().eq("id", parsedId.data);
    if (error) return { success: false, error: `Could not delete event: ${error.message}` };

    revalidatePath("/organizers");
    revalidatePath("/portal");
    return { success: true };
 } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Could not delete event." };
 }
}