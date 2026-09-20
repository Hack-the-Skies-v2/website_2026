"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireOrganizer } from "@/lib/auth";
import { applicationDecisionEmail, type ApplicationDecision } from "@/lib/application-emails";
import { resend } from "@/lib/resend";
import { createClient } from "@/lib/supabase/server";

export type OrganizerDecision = "accepted" | "rejected" | "pending";

const decisionSchema = z.object({
  applicationIds: z.array(z.uuid()).min(1).max(100),
  decision: z.enum(["accepted", "rejected", "pending"]),
});

function fromAddress() {
  return process.env.RESEND_FROM || "Hack the Skies <noreply@hacktheskies.com>";
}

function normalizeType(type: string): "hacker" | "mentor" | "judge" | null {
  const value = type.trim().toLowerCase();
  if (value === "hacker" || value === "mentor" || value === "judge") return value;
  return null;
}

/**
 * Saves the decision on live portal applications (keyed by applications.id).
 * Emails the applicant when RESEND_KEY is set.
 */
export async function decideApplications(input: unknown) {
  await requireOrganizer();
  const parsed = decisionSchema.safeParse(input);
  if (!parsed.success) throw new Error("Invalid decision request.");

  const sendsEmail = parsed.data.decision !== "pending";
  const applicationIds = [...new Set(parsed.data.applicationIds)];
  const supabase = await createClient();

  const { data: knownApplications, error: lookupError } = await supabase
    .from("applications")
    .select("id, type, email, first_name")
    .in("id", applicationIds)
    .in("type", ["hacker", "mentor", "judge", "Hacker", "Mentor", "Judge"]);

  if (lookupError || (knownApplications?.length ?? 0) !== applicationIds.length) {
    throw new Error("One or more applications could not be found.");
  }

  const { data, error } = await supabase
    .from("applications")
    .update({
      status: parsed.data.decision,
      decided_at: parsed.data.decision === "pending" ? null : new Date().toISOString(),
    })
    .in("id", applicationIds)
    .select("id, type, email, first_name");

  if (error || (data?.length ?? 0) !== applicationIds.length) {
    throw new Error("The decision could not be saved.");
  }

  if (!sendsEmail) {
    revalidatePath("/organizers");
    for (const id of applicationIds) revalidatePath(`/organizers/review/${id}`);
    return { decided: data.length, emailed: 0, emailFailures: 0, emailSkipped: false };
  }

  if (!process.env.RESEND_KEY) {
    await supabase
      .from("applications")
      .update({
        notification_error: "Decision saved. Email skipped because RESEND_KEY is not set.",
      })
      .in("id", applicationIds);
    revalidatePath("/organizers");
    for (const id of applicationIds) revalidatePath(`/organizers/review/${id}`);
    return { decided: data.length, emailed: 0, emailFailures: 0, emailSkipped: true };
  }

  const sentIds: string[] = [];
  const failedIds: string[] = [];

  for (const application of data as {
    id: string;
    type: string;
    email: string | null;
    first_name: string | null;
  }[]) {
    const type = normalizeType(application.type);
    if (!type) {
      failedIds.push(application.id);
      continue;
    }

    const email = application.email?.trim();
    if (!email) {
      failedIds.push(application.id);
      continue;
    }

    let firstName = application.first_name?.trim() || "there";
    if (firstName === "there" && type === "mentor") {
      const { data: mentor } = await supabase
        .from("mentor_applications")
        .select("name")
        .eq("user_id", application.id)
        .maybeSingle();
      firstName = mentor?.name?.trim().split(/\s+/)[0] || firstName;
    }
    if (firstName === "there" && type === "judge") {
      const { data: judge } = await supabase
        .from("judge_applications")
        .select("name")
        .eq("user_id", application.id)
        .maybeSingle();
      firstName = judge?.name?.trim().split(/\s+/)[0] || firstName;
    }

    const content = applicationDecisionEmail({
      firstName,
      type,
      decision: parsed.data.decision as ApplicationDecision,
    });

    const { error: sendError } = await resend.emails.send({
      from: fromAddress(),
      to: [email],
      subject: content.subject,
      html: content.html,
    });
    if (sendError) failedIds.push(application.id);
    else sentIds.push(application.id);
  }

  if (sentIds.length) {
    await supabase
      .from("applications")
      .update({ notification_sent_at: new Date().toISOString(), notification_error: null })
      .in("id", sentIds);
  }
  if (failedIds.length) {
    await supabase
      .from("applications")
      .update({ notification_error: "Email delivery failed; retry after checking Resend." })
      .in("id", failedIds);
  }

  revalidatePath("/organizers");
  for (const id of applicationIds) revalidatePath(`/organizers/review/${id}`);
  return {
    decided: data.length,
    emailed: sentIds.length,
    emailFailures: failedIds.length,
    emailSkipped: false,
  };
}
