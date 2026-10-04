import "server-only";

import { createClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export type ApplicationAccess = {
    applicationType: "hacker" | "judge" | "mentor" | null;
    applicationStatus: string | null;
    isHacker: boolean;
    isJudge: boolean;
    isMentor: boolean;
};

export async function getApplicationAccess(
    supabase: SupabaseServerClient,
    userId: string,
): Promise<ApplicationAccess> {
    const [
        { data: application },
        { data: hackerApp },
        { data: judgeApp },
        { data: mentorApp },
        { data: profile },
    ] = await Promise.all([
        supabase
            .from("applications")
            .select("application_type, status")
            .eq("user_id", userId)
            .maybeSingle(),
        supabase
            .from("hacker_applications")
            .select("user_id")
            .eq("user_id", userId)
            .maybeSingle(),
        supabase
            .from("judge_applications")
            .select("user_id")
            .eq("user_id", userId)
            .maybeSingle(),
        supabase
            .from("mentor_applications")
            .select("user_id")
            .eq("user_id", userId)
            .maybeSingle(),
        supabase
            .from("users")
            .select("judge")
            .eq("id", userId)
            .maybeSingle(),
    ]);

    const rawType = application?.application_type?.toLowerCase();
    const applicationType = rawType === "hacker" || rawType === "judge" || rawType === "mentor"
        ? rawType
        : null;
    const isJudge = Boolean(profile?.judge || applicationType === "judge" || judgeApp);
    const isMentor = Boolean(applicationType === "mentor" || mentorApp);
    const isHacker = Boolean(
        applicationType === "hacker" ||
        hackerApp ||
        (application && !isJudge && !isMentor),
    );

    return {
        applicationType,
        applicationStatus: application?.status ?? null,
        isHacker,
        isJudge,
        isMentor,
    };
}