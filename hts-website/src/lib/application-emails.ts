import escapeHtml from "@/lib/escapeHtml";

export type ApplicationDecision = "accepted" | "rejected";

export function applicationDecisionEmail(input: {
  firstName: string;
  decision: ApplicationDecision;
}) {
  const firstName = escapeHtml(input.firstName);

  if (input.decision === "accepted") {
    return {
      subject: "You're in for Hack the Skies 2026",
      html: `
        <p>Hi ${firstName},</p>
        <p>We're thrilled to invite you to Hack the Skies 2026 as a hacker.</p>
        <p>Watch your inbox for next steps, Discord access, and event details. We can't wait to build with you.</p>
        <p>The Hack the Skies team</p>
      `,
    };
  }

  return {
    subject: "Hack the Skies 2026 Application Update",
    html: `
      <p>Hi ${firstName},</p>
      <p>Thank you for applying to Hack the Skies 2026. We're grateful for the time and care you put into your application.</p>
      <p>We aren't able to offer you a hacker spot this time. We hope you'll keep creating and apply to a future event.</p>
      <p>The Hack the Skies team</p>
    `,
  };
}
