"use server";

import { z } from "zod";
import { applicationDecisionEmail } from "@/lib/application-emails";
import { resend } from "@/lib/resend";

const previewDecisionSchema = z.object({
  decisions: z
    .array(
      z.object({
        firstName: z.string().trim().min(1).max(80),
        type: z.enum(["hacker", "mentor"]),
        decision: z.enum(["accepted", "rejected"]),
      }),
    )
    .min(1)
    .max(20),
});

function fromAddress() {
  return (
    process.env.RESEND_FROM
    || "Hack the Skies <noreply@hacktheskies.com>"
  );
}

function testRecipient() {
  const to = process.env.TEST_DECISION_EMAIL?.trim();
  return to || null;
}

/**
 * Preview-dashboard accept/reject: uses live Resend templates, but delivers
 * every message to TEST_DECISION_EMAIL from env (not the mock applicant address).
 */
export async function sendPreviewDecisionEmails(input: unknown) {
  const parsed = previewDecisionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: "Invalid preview decision request." };
  }
  if (!process.env.RESEND_KEY) {
    return { ok: false as const, error: "RESEND_KEY is not set in .env.local." };
  }

  const to = testRecipient();
  if (!to) {
    return {
      ok: false as const,
      error: "Set TEST_DECISION_EMAIL in .env.local to the inbox that should receive preview sends.",
    };
  }

  let emailed = 0;
  const errors: string[] = [];

  for (const item of parsed.data.decisions) {
    const email = applicationDecisionEmail({
      firstName: item.firstName,
      type: item.type,
      decision: item.decision,
    });
    const { error } = await resend.emails.send({
      from: fromAddress(),
      to: [to],
      subject: `[PREVIEW ${item.decision.toUpperCase()}] ${email.subject}`,
      html: `${email.html}<hr /><p style="color:#666;font-size:12px;">Preview send from the organizer mock dashboard. Delivered to TEST_DECISION_EMAIL.</p>`,
    });
    if (error) errors.push(error.message || "Send failed");
    else emailed += 1;
  }

  if (emailed === 0) {
    return { ok: false as const, error: errors[0] || "No emails were sent." };
  }

  return {
    ok: true as const,
    emailed,
    emailFailures: errors.length,
    to,
  };
}
