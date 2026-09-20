"use server";

import { z } from "zod";
import { applicationDecisionEmail } from "@/lib/application-emails";
import { resend } from "@/lib/resend";

const testEmailSchema = z.object({
  to: z.email(),
  firstName: z.string().trim().min(1).max(80),
  type: z.enum(["hacker", "mentor", "judge"]),
  decision: z.enum(["accepted", "rejected"]),
});

function fromAddress() {
  return (
    process.env.RESEND_FROM
    || "Hack the Skies <noreply@hacktheskies.com>"
  );
}

/** Local/manual test of the same accept/reject templates used in production. */
export async function sendTestDecisionEmail(input: unknown) {
  const parsed = testEmailSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: "Enter a valid email, name, track, and decision." };
  }
  if (!process.env.RESEND_KEY) {
    return { ok: false as const, error: "RESEND_KEY is not set in .env.local." };
  }

  const email = applicationDecisionEmail({
    firstName: parsed.data.firstName,
    type: parsed.data.type,
    decision: parsed.data.decision,
  });

  const { data, error } = await resend.emails.send({
    from: fromAddress(),
    to: [parsed.data.to],
    subject: `[TEST] ${email.subject}`,
    html: `${email.html}<hr /><p style="color:#666;font-size:12px;">Test send from the organizer console. Not a live applicant decision.</p>`,
  });

  if (error) {
    return { ok: false as const, error: error.message || "Resend rejected the send." };
  }

  return { ok: true as const, id: data?.id ?? null };
}
