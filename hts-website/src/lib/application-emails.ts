import escapeHtml from "@/lib/escapeHtml";

export type ApplicationDecision = "accepted" | "rejected";

export function applicationDecisionEmail(input: {
  firstName: string;
  type: "hacker" | "mentor";
  decision: ApplicationDecision;
}) {
  const firstName = escapeHtml(input.firstName);

  if (input.type === "mentor") {
    if (input.decision === "accepted") {
      return {
        subject: "You're in as a mentor for Hack the Skies 2026",
        html: `
          <p>Hi ${firstName},</p>
          <p>We’re thrilled to invite you to mentor at Hack the Skies 2026.</p>
          <p>Watch your inbox for mentor logistics, Discord access, and the weekend schedule. We’re excited to have you supporting our hackers.</p>
          <p>The Hack the Skies team</p>
        `,
      };
    }

    return {
      subject: "Hack the Skies 2026 mentor application update",
      html: `
        <p>Hi ${firstName},</p>
        <p>Thank you for applying to mentor at Hack the Skies 2026. We’re grateful for the time and care you put into your application.</p>
        <p>We aren’t able to offer you a mentor spot this time. We hope you’ll stay connected and consider mentoring at a future event.</p>
        <p>The Hack the Skies team</p>
      `,
    };
  }

  if (input.decision === "accepted") {
    return {
      subject: "You're in for Hack the Skies 2026",
      html: `
        <p>Hi ${firstName},</p>
        <p>We’re thrilled to invite you to Hack the Skies 2026 as a hacker.</p>
        <p>Watch your inbox for next steps, Discord access, and event details. We can’t wait to build with you.</p>
        <p>The Hack the Skies team</p>
      `,
    };
  }

  return {
    subject: "Hack the Skies 2026 application update",
    html: `
      <p>Hi ${firstName},</p>
      <p>Thank you for applying to Hack the Skies 2026. We’re grateful for the time and care you put into your application.</p>
      <p>We aren’t able to offer you a hacker spot this time. We hope you’ll keep creating and apply to a future event.</p>
      <p>The Hack the Skies team</p>
    `,
  };
}
