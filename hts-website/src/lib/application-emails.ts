import escapeHtml from "@/lib/escapeHtml";

export type ApplicationDecision = "accepted" | "rejected";

export function applicationDecisionEmail(input: {
  firstName: string;
  decision: ApplicationDecision;
}) {
  const name = input.firstName?.trim() ? escapeHtml(input.firstName.trim()) : "there";
  const plainName = input.firstName?.trim() || "there";

  if (input.decision === "accepted") {
    return {
      subject: "You're Accepted! Hack the Skies 2026 ✈️",
      html: `
        <p>Hi ${name},</p>
        <p>Congratulations! We're excited to let you know that you've been accepted to Hack the Skies 2026, taking place on October 17-18, 2026, at Humber Polytechnic's North Campus!</p>
        <p>To confirm your attendance, please complete the confirmation form linked below by this Monday at 11:59 PM at the latest. Submitting this form is required to secure your spot at Hack the Skies 2026.</p>
        <p><a href="https://forms.gle/PjbqPGYAmQdSQXT67">Confirmation Form</a></p>
        <p>Once you've completed the form, you'll be invited to our official Hack the Skies Discord server, where we'll be sharing important event updates, schedules, announcements, and everything else you'll need to know leading up to the hackathon.</p>
        <p>As you prepare for the event, make sure to bring your laptop or device fully charged, along with your charger. We recommend wearing comfortable clothes and bringing any other essentials you'll need throughout the weekend.</p>
        <p>If you're no longer able to attend, please let us know as soon as possible so we can make the necessary arrangements.</p>
        <p>Once you join the Discord, please refer to the Hacker Guide for additional information about the event. If you have any questions, feel free to reply to this email or send us a DM on Instagram at <a href="https://www.instagram.com/hacktheskies">@hacktheskies</a></p>
        <p>We're incredibly excited to have you join us for Hack the Skies 2026! Come ready to learn, build, meet new people, and bring your ideas to life.</p>
        <p>See you at Humber! ✈️</p>
        <p>Best,<br />The Hack the Skies Team</p>
      `,
      text: `Hi ${plainName},\n\nCongratulations! We're excited to let you know that you've been accepted to Hack the Skies 2026, taking place on October 17-18, 2026, at Humber Polytechnic's North Campus!\n\nTo confirm your attendance, please complete the confirmation form linked below by this Monday at 11:59 PM at the latest. Submitting this form is required to secure your spot at Hack the Skies 2026.\n\nConfirmation Form: https://forms.gle/PjbqPGYAmQdSQXT67\n\nOnce you've completed the form, you'll be invited to our official Hack the Skies Discord server, where we'll be sharing important event updates, schedules, announcements, and everything else you'll need to know leading up to the hackathon.\n\nAs you prepare for the event, make sure to bring your laptop or device fully charged, along with your charger. We recommend wearing comfortable clothes and bringing any other essentials you'll need throughout the weekend.\n\nIf you're no longer able to attend, please let us know as soon as possible so we can make the necessary arrangements.\n\nOnce you join the Discord, please refer to the Hacker Guide for additional information about the event. If you have any questions, feel free to reply to this email or send us a DM on Instagram at @hacktheskies\n\nWe're incredibly excited to have you join us for Hack the Skies 2026! Come ready to learn, build, meet new people, and bring your ideas to life.\n\nSee you at Humber! ✈️\n\nBest,\nThe Hack the Skies Team`,
    };
  }

  return {
    subject: "Hack the Skies 2026 Application Update",
    html: `
      <p>Hi ${name},</p>
      <p>Thank you for your interest in Hack the Skies 2026 and for taking the time to submit an application!</p>
      <p>Unfortunately, due to limited capacity and the high level of interest we've received this year, we're unable to offer you a spot at Hack the Skies 2026.</p>
      <p>We know this may be disappointing, and we sincerely appreciate your enthusiasm for being part of our event. We encourage you to stay connected with us through our Instagram <a href="https://www.instagram.com/hacktheskies">@hacktheskies</a> for updates on future events and opportunities to get involved.</p>
      <p>Thank you again for your interest in Hack the Skies. We hope to see you at a future event!</p>
      <p>Best,<br />The Hack the Skies Team</p>
    `,
    text: `Hi ${plainName},\n\nThank you for your interest in Hack the Skies 2026 and for taking the time to submit an application!\n\nUnfortunately, due to limited capacity and the high level of interest we've received this year, we're unable to offer you a spot at Hack the Skies 2026.\n\nWe know this may be disappointing, and we sincerely appreciate your enthusiasm for being part of our event. We encourage you to stay connected with us through our Instagram @hacktheskies for updates on future events and opportunities to get involved.\n\nThank you again for your interest in Hack the Skies. We hope to see you at a future event!\n\nBest,\nThe Hack the Skies Team`,
  };
}
