"use server";

import escapeHtml from "@/lib/escapeHtml";
import { resend } from "@/lib/resend";
import { z } from "zod";

const contactSchema = z.object({
    email: z.email({
        error: "Invalid email address",
    }).max(254),
    message: z.string().trim().min(1, {
        error: "Message is required",
    }).max(5000, {
        error: "Message is too long",
    }),
});

// TODO implement the Upstash rate limiting

export async function submitContactForm(email: string, message: string, website: string) {
    if (website) {
        return {
            success: true
        }
    }
    const result = contactSchema.safeParse({
        email,
        message,
    });

    if (!result.success) {
        return {
            success: false,
            error: result.error.issues[0].message,
        };
    }

    const { error } = await resend.emails.send({
        from: "Hack the Skies <noreply@hacktheskies.com>",
        to: ["hello@hacktheskies.com"],
        replyTo: result.data.email,
        subject: "Contact Form Submission",
        html: `
            <h2>New Contact Form Submission</h2>
            <p><strong>Email:</strong> ${escapeHtml(result.data.email)}</p>
            <p><strong>Message:</strong></p>
            <p>${escapeHtml(result.data.message)}</p>
        `,
    });

    if (error) {
        return {
            success: false,
            error: "Failed to send email",
        };
    }

    return {
        success: true,
    };
}