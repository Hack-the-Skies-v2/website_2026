"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { questionsForType } from "@/lib/grading/questions";
import { isValidScore } from "@/lib/grading/scoring";
import type { ApplicationType } from "@/lib/grading/types";
import { requireOrganizer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const gradeSchema = z.object({
  applicationId: z.uuid(),
  scores: z.record(z.string(), z.number()),
});

export async function submitOrganizerGrade(input: unknown) {
  const organizer = await requireOrganizer();
  const parsed = gradeSchema.safeParse(input);
  if (!parsed.success) throw new Error("Invalid grade.");

  const supabase = await createClient();
  const { data: application, error: lookupError } = await supabase
    .from("applications")
    .select("id, type")
    .eq("id", parsed.data.applicationId)
    .maybeSingle();

  if (lookupError || !application) throw new Error("Application not found.");

  const questions = questionsForType(application.type as ApplicationType);
  if (Object.keys(parsed.data.scores).length !== questions.length) {
    throw new Error("Every question must be scored.");
  }

  for (const question of questions) {
    const score = parsed.data.scores[question.id];
    if (!isValidScore(score)) {
      throw new Error(`Invalid score for ${question.id}.`);
    }
  }

  const { error } = await supabase.from("application_grades").upsert(
    {
      application_id: parsed.data.applicationId,
      grader_id: organizer.id,
      scores: parsed.data.scores,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "application_id,grader_id" },
  );

  if (error) throw new Error("Could not save grade.");

  revalidatePath("/organizers");
  revalidatePath(`/organizers/review/${parsed.data.applicationId}`);
}

export async function clearOrganizerGrade(applicationId: string) {
  const organizer = await requireOrganizer();
  if (!z.uuid().safeParse(applicationId).success) throw new Error("Invalid application.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("application_grades")
    .delete()
    .eq("application_id", applicationId)
    .eq("grader_id", organizer.id);

  if (error) throw new Error("Could not clear grade.");

  revalidatePath("/organizers");
  revalidatePath(`/organizers/review/${applicationId}`);
}
