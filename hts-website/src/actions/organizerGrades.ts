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

function normalizeType(type: string): ApplicationType | null {
  const value = type.trim().toLowerCase();
  if (value === "hacker" || value === "mentor") return value;
  return null;
}

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
  const type = normalizeType(application.type as string);
  if (!type) {
    throw new Error("Only hacker and mentor applications can be graded.");
  }

  const questions = questionsForType(type);
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
      application_user_id: parsed.data.applicationId,
      grader_id: organizer.id,
      scores: parsed.data.scores,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "application_user_id,grader_id" },
  );

  if (error) {
    throw new Error(
      `Could not save grade (${error.message}). Apply the organizer grades migration if the table is missing.`,
    );
  }

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
    .eq("application_user_id", applicationId)
    .eq("grader_id", organizer.id);

  if (error) throw new Error("Could not clear grade.");

  revalidatePath("/organizers");
  revalidatePath(`/organizers/review/${applicationId}`);
}
