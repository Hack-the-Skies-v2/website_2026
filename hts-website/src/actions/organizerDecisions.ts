"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireOrganizer } from "@/lib/auth";
import { applicationDecisionEmail, type ApplicationDecision } from "@/lib/application-emails";
import { resend } from "@/lib/resend";
import { createClient } from "@/lib/supabase/server";

const decisionSchema = z.object({
  applicationIds: z.array(z.uuid()).min(1).max(100),
  decision: z.enum(["accepted", "rejected"]),
});

type DecidableApplication = { id: string; type: "hacker" | "mentor"; first_name: string; email: string };

export async function decideApplications(input: unknown) {
  await requireOrganizer();
  const parsed = decisionSchema.safeParse(input);
  if (!parsed.success) throw new Error("Invalid decision request.");
  if (!process.env.RESEND_KEY) throw new Error("Decision emails are not configured. Add RESEND_KEY before sending decisions.");

  const applicationIds = [...new Set(parsed.data.applicationIds)];
  const supabase = await createClient();
  const { data: knownApplications, error: lookupError } = await supabase.from("applications").select("id").in("id", applicationIds);
  if (lookupError || (knownApplications?.length ?? 0) !== applicationIds.length) throw new Error("One or more applications could not be found.");

  const { data, error } = await supabase
    .from("applications")
    .update({ status: parsed.data.decision, decided_at: new Date().toISOString() })
    .in("id", applicationIds)
    .select("id, type, first_name, email");
  if (error || (data?.length ?? 0) !== applicationIds.length) throw new Error("The decision could not be saved.");

  const sentIds: string[] = [];
  const failedIds: string[] = [];
  for (const application of data as DecidableApplication[]) {
    const email = applicationDecisionEmail({ firstName: application.first_name, type: application.type, decision: parsed.data.decision as ApplicationDecision });
    const { error: sendError } = await resend.emails.send({ from: "Hack the Skies <noreply@hacktheskies.com>", to: [application.email], subject: email.subject, html: email.html });
    if (sendError) failedIds.push(application.id); else sentIds.push(application.id);
  }

  if (sentIds.length) await supabase.from("applications").update({ notification_sent_at: new Date().toISOString(), notification_error: null }).in("id", sentIds);
  if (failedIds.length) await supabase.from("applications").update({ notification_error: "Email delivery failed; retry after checking Resend." }).in("id", failedIds);
  revalidatePath("/organizers");
  for (const id of applicationIds) revalidatePath(`/organizers/review/${id}`);
  return { decided: data.length, emailed: sentIds.length, emailFailures: failedIds.length };
}
