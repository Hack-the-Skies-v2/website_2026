"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const prizeIdSchema = z.uuid();

type RedeemPrizeResult =
    | { success: true; balance: number }
    | { success: false; error: string };

export async function redeemPrize(input: unknown): Promise<RedeemPrizeResult> {
    const parsed = prizeIdSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: "Invalid prize." };

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "You must be signed in to redeem a prize." };

    const { data, error } = await supabase.rpc("redeem_point_prize", {
        p_prize_id: parsed.data,
    });
    if (error) {
        const message = error.message.toLowerCase();
        if (message.includes("enough points")) {
            return { success: false, error: "You don't have enough points for this prize." };
        }
        if (message.includes("quantity exhausted")) {
            return { success: false, error: "This prize is no longer available." };
        }
        if (message.includes("redemption limit")) {
            return { success: false, error: "You have already redeemed this prize." };
        }
        return { success: false, error: "Unable to redeem this prize right now." };
    }

    revalidatePath("/portal");
    return { success: true, balance: data };
}
