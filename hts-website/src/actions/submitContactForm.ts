"use server";

import escapeHtml from "@/lib/escapeHtml";
import { resend } from "@/lib/resend";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { headers } from "next/headers";
import { z } from "zod";

const contactSchema = z.object({
    email: z
        .email({
            error: "Invalid email address",
        })
        .max(254),
    message: z
        .string()
        .trim()
        .min(1, {
            error: "Message is required",
        })
        .max(5000, {
            error: "Message is too long",
        }),
});

const ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(5, "10 m"),
});

export async function submitContactForm(
    email: string,
    message: string,
    website: string,
) {
    if (website) {
        return {
            success: true,
        };
    }
    const result = contactSchema.safeParse({
        email,
        message,
    });

    if (!result.success) {
        return {
            success: false,
            error: result.error.issues[0]?.message ?? "Invalid form input",
        };
    }

    const headersList = await headers();
    const ip = headersList.get("x-forwarded-for")?.split(",")[0] ?? "unknown";

    const { success } = await ratelimit.limit(`contact:${ip}`);

    if (!success) {
        return {
            success: false,
            error: "Too many requests. Please try again later.",
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
