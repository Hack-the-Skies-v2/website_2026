"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireOrganizer } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

const prizeIdSchema = z.uuid();
const prizeFieldsSchema = z.object({
    name: z.string().trim().min(1, "Name is required.").max(200),
    description: z.string().trim().max(5000),
    pointsRequired: z.coerce.number().int().positive("Points required must be greater than zero."),
    quantity: z.union([z.literal(""), z.coerce.number().int().nonnegative()]),
    maxRedemptions: z.union([z.literal(""), z.coerce.number().int().positive()]),
    active: z.enum(["true", "false"]),
    removeImage: z.enum(["true", "false"]),
});

type PrizeResult = { success: true } | { success: false; error: string };

const imageBucket = "prize-images";
const maxImageSize = 10 * 1024 * 1024;
const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export async function updateOrganizerPrize(formData: FormData): Promise<PrizeResult> {
    await requireOrganizer();

    const parsedId = prizeIdSchema.safeParse(formData.get("id"));
    if (!parsedId.success) return { success: false, error: "Invalid prize." };

    const parsed = prizeFieldsSchema.safeParse({
        name: formData.get("name"),
        description: formData.get("description") ?? "",
        pointsRequired: formData.get("pointsRequired"),
        quantity: formData.get("quantity") ?? "",
        maxRedemptions: formData.get("maxRedemptions") ?? "",
        active: formData.get("active"),
        removeImage: formData.get("removeImage") ?? "false",
    });
    if (!parsed.success) {
        return { success: false, error: parsed.error.issues[0]?.message ?? "Check the prize details." };
    }

    const image = formData.get("image");
    if (image && !(image instanceof File)) return { success: false, error: "Invalid image upload." };
    if (image instanceof File && image.size > 0) {
        if (!allowedImageTypes.has(image.type)) {
            return { success: false, error: "Images must be JPEG, PNG, WebP, or GIF files." };
        }
        if (image.size > maxImageSize) return { success: false, error: "Images must be 10 MB or smaller." };
    }

    const supabase = createAdminClient();
    const { data: existing, error: existingError } = await supabase
        .from("point_prizes")
        .select("image_path")
        .eq("id", parsedId.data)
        .single();
    if (existingError) return { success: false, error: `Could not load prize: ${existingError.message}` };

    let imagePath = existing.image_path as string | null;
    let uploadedImagePath: string | null = null;
    if (image instanceof File && image.size > 0) {
        const extension = image.name.split(".").pop()?.toLowerCase() || "bin";
        uploadedImagePath = `${parsedId.data}/${crypto.randomUUID()}.${extension}`;
        const { error } = await supabase.storage.from(imageBucket).upload(uploadedImagePath, image, {
            contentType: image.type,
            upsert: false,
        });
        if (error) return { success: false, error: `Could not upload image: ${error.message}` };
        imagePath = uploadedImagePath;
    } else if (parsed.data.removeImage === "true") {
        imagePath = null;
    }

    const { error: updateError } = await supabase
        .from("point_prizes")
        .update({
            name: parsed.data.name,
            description: parsed.data.description || null,
            points_required: parsed.data.pointsRequired,
            quantity: parsed.data.quantity === "" ? null : parsed.data.quantity,
            max_redemptions: parsed.data.maxRedemptions === "" ? null : parsed.data.maxRedemptions,
            active: parsed.data.active === "true",
            image_path: imagePath,
        })
        .eq("id", parsedId.data);

    if (updateError) {
        if (uploadedImagePath) await supabase.storage.from(imageBucket).remove([uploadedImagePath]);
        return { success: false, error: `Could not update prize: ${updateError.message}` };
    }

    if (existing.image_path && existing.image_path !== imagePath) {
        const { error } = await supabase.storage.from(imageBucket).remove([existing.image_path]);
        if (error) return { success: false, error: `Prize updated, but the old image could not be deleted: ${error.message}` };
    }

    revalidatePath("/organizers");
    revalidatePath("/portal");
    return { success: true };
}

export async function createOrganizerPrize(formData: FormData): Promise<PrizeResult> {
    await requireOrganizer();

    const parsed = prizeFieldsSchema.safeParse({
        name: formData.get("name"),
        description: formData.get("description") ?? "",
        pointsRequired: formData.get("pointsRequired"),
        quantity: formData.get("quantity") ?? "",
        maxRedemptions: formData.get("maxRedemptions") ?? "",
        active: formData.get("active"),
        removeImage: "false",
    });
    if (!parsed.success) {
        return { success: false, error: parsed.error.issues[0]?.message ?? "Check the prize details." };
    }

    const image = formData.get("image");
    if (image && !(image instanceof File)) return { success: false, error: "Invalid image upload." };
    if (image instanceof File && image.size > 0) {
        if (!allowedImageTypes.has(image.type)) return { success: false, error: "Images must be JPEG, PNG, WebP, or GIF files." };
        if (image.size > maxImageSize) return { success: false, error: "Images must be 10 MB or smaller." };
    }

    const supabase = createAdminClient();
    const prizeId = crypto.randomUUID();
    let imagePath: string | null = null;
    if (image instanceof File && image.size > 0) {
        const extension = image.name.split(".").pop()?.toLowerCase() || "bin";
        imagePath = `${prizeId}/${crypto.randomUUID()}.${extension}`;
        const { error } = await supabase.storage.from(imageBucket).upload(imagePath, image, {
            contentType: image.type,
            upsert: false,
        });
        if (error) return { success: false, error: `Could not upload image: ${error.message}` };
    }

    const { error } = await supabase.from("point_prizes").insert({
        id: prizeId,
        name: parsed.data.name,
        description: parsed.data.description || null,
        points_required: parsed.data.pointsRequired,
        quantity: parsed.data.quantity === "" ? null : parsed.data.quantity,
        max_redemptions: parsed.data.maxRedemptions === "" ? null : parsed.data.maxRedemptions,
        active: parsed.data.active === "true",
        image_path: imagePath,
    });
    if (error) {
        if (imagePath) await supabase.storage.from(imageBucket).remove([imagePath]);
        return { success: false, error: `Could not create prize: ${error.message}` };
    }

    revalidatePath("/organizers");
    revalidatePath("/portal");
    return { success: true };
}

export async function deleteOrganizerPrize(id: string): Promise<PrizeResult> {
    await requireOrganizer();
    const parsedId = prizeIdSchema.safeParse(id);
    if (!parsedId.success) return { success: false, error: "Invalid prize." };

    const supabase = createAdminClient();
    const { data: prize, error: readError } = await supabase
        .from("point_prizes")
        .select("image_path")
        .eq("id", parsedId.data)
        .single();
    if (readError) return { success: false, error: `Could not load prize: ${readError.message}` };

    const { error: deleteError } = await supabase.from("point_prizes").delete().eq("id", parsedId.data);
    if (deleteError) {
        return {
            success: false,
            error: deleteError.code === "23503"
                ? "This prize cannot be deleted because it has redemption history. Mark it inactive instead."
                : `Could not delete prize: ${deleteError.message}`,
        };
    }
    if (prize.image_path) {
        const { error } = await supabase.storage.from(imageBucket).remove([prize.image_path]);
        if (error) return { success: false, error: `Prize deleted, but its image could not be deleted: ${error.message}` };
    }

    revalidatePath("/organizers");
    revalidatePath("/portal");
    return { success: true };
}

export async function deleteOrganizerPrizeImage(id: string): Promise<PrizeResult> {
    await requireOrganizer();
    const parsedId = prizeIdSchema.safeParse(id);
    if (!parsedId.success) return { success: false, error: "Invalid prize." };

    const supabase = createAdminClient();
    const { data: prize, error: readError } = await supabase
        .from("point_prizes")
        .select("image_path")
        .eq("id", parsedId.data)
        .single();
    if (readError) return { success: false, error: `Could not load prize: ${readError.message}` };
    if (!prize.image_path) return { success: true };

    const { error: removeError } = await supabase.storage.from(imageBucket).remove([prize.image_path]);
    if (removeError) return { success: false, error: `Could not delete image: ${removeError.message}` };

    const { error: updateError } = await supabase
        .from("point_prizes")
        .update({ image_path: null })
        .eq("id", parsedId.data);
    if (updateError) return { success: false, error: `Image deleted, but prize could not be updated: ${updateError.message}` };

    revalidatePath("/organizers");
    revalidatePath("/portal");
    return { success: true };
}

export async function getOrganizerPrizeImageUrl(path: string | null) {
    if (!path) return null;
    const supabase = createAdminClient();
    const { data, error } = await supabase.storage.from(imageBucket).createSignedUrl(path, 60 * 60);
    if (error) throw new Error(`Could not load prize image: ${error.message}`);
    return data.signedUrl;
}
