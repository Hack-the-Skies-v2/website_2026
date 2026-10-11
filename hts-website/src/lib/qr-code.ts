import "server-only";

import { randomBytes } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";

function siteUrl() {
    const configuredUrl = process.env.NEXT_PUBLIC_QR_CODE_BASE_URL?.trim();
    if (!configuredUrl) return "https://www.hacktheskies.com";

    try {
        const url = new URL(configuredUrl);
        if (url.protocol !== "https:" || url.hostname === "localhost" || url.hostname === "127.0.0.1") {
            return "https://www.hacktheskies.com";
        }
        return url.toString().replace(/\/$/, "");
    } catch {
        return "https://www.hacktheskies.com";
    }
}

export async function ensureQrCodeLink(userId: string) {
    const admin = createAdminClient();
    const { data: user, error: lookupError } = await admin
        .from("users")
        .select("qr_code_link")
        .eq("id", userId)
        .maybeSingle();

    if (lookupError) throw lookupError;
    if (user?.qr_code_link) return user.qr_code_link;

    const token = randomBytes(32).toString("base64url");
    const qrCodeLink = `${siteUrl()}/check-in?code=${token}`;
    const { data: updatedUser, error: updateError } = await admin
        .from("users")
        .update({ qr_code_link: qrCodeLink })
        .eq("id", userId)
        .is("qr_code_link", null)
        .select("qr_code_link")
        .maybeSingle();

    if (updateError) throw updateError;
    if (updatedUser?.qr_code_link) return updatedUser.qr_code_link;

    const { data: existingUser, error: existingError } = await admin
        .from("users")
        .select("qr_code_link")
        .eq("id", userId)
        .maybeSingle();
    if (existingError) throw existingError;
    if (existingUser?.qr_code_link) return existingUser.qr_code_link;
    throw new Error("Could not save the QR code link.");
}
