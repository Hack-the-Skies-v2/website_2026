"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireOrganizer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  userId: z.string().uuid(),
  amount: z.number().int().min(-10000).max(10000).refine((value) => value !== 0, "Enter a non-zero amount"),
  reason: z.string().trim().min(1, "A reason is required").max(500),
});

export async function adjustParticipantPoints(input: {
  userId: string;
  amount: number;
  reason: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const organizer = await requireOrganizer();
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the amount and reason." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("point_adjustments").insert({
    user_id: parsed.data.userId,
    points: parsed.data.amount,
    reason: parsed.data.reason,
    created_by: organizer.id,
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath("/organizers");
  revalidatePath("/organizers/participants");
  revalidatePath(`/organizers/participants/${parsed.data.userId}`);
  return { ok: true };
}
