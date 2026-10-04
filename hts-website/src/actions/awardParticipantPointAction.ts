"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireOrganizer } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

const schema = z.object({
  userId: z.uuid(),
  pointActionId: z.uuid(),
});

export async function awardParticipantPointAction(input: {
  userId: string;
  pointActionId: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const organizer = await requireOrganizer();
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Select a valid point action." };

  const supabase = createAdminClient();
  const { error } = await supabase.from("point_earnings").insert({
    user_id: parsed.data.userId,
    point_action_id: parsed.data.pointActionId,
    created_by: organizer.id,
  });

  if (error) {
    return {
      ok: false,
      error: error.message.includes("redemption limit reached")
        ? "This participant has already reached this action's limit."
        : error.message,
    };
  }

  revalidatePath("/organizers");
  revalidatePath("/organizers/participants");
  revalidatePath(`/organizers/participants/${parsed.data.userId}`);
  return { ok: true };
}
