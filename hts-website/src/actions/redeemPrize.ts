"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const prizeIdSchema = z.uuid();

export async function redeemPrize(input: unknown) {
    const parsed = prizeIdSchema.safeParse(input);
    if (!parsed.success) throw new Error("Invalid prize.");

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("You must be signed in to redeem a prize.");

    const { data, error } = await supabase.rpc("redeem_point_prize", {
        p_prize_id: parsed.data,
    });
    if (error) throw new Error(error.message);

    revalidatePath("/portal");
    return data;
}
