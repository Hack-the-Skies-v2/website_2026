import "server-only";

import { createClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export type ApplicationAccess = {
    applicationType: "hacker" | "judge" | "mentor" | null;
    applicationStatus: string | null;
    isHacker: boolean;
    isHackerRejected: boolean;
    isJudge: boolean;
    isMentor: boolean;
};

export async function getApplicationAccess(
    supabase: SupabaseServerClient,
    userId: string,
): Promise<ApplicationAccess> {
    const [
        { data: application, error: applicationError },
        { data: hackerApp },
        { data: judgeApp },
        { data: mentorApp },
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
    ]);

    if (applicationError) {
        console.error("[application-access] applications query failed", {
            userId,
            code: applicationError.code,
            message: applicationError.message,
            details: applicationError.details,
            hint: applicationError.hint,
        });
    }

    const rawType = application?.application_type?.toLowerCase();
    const applicationType = rawType === "hacker" || rawType === "judge" || rawType === "mentor"
        ? rawType
        : null;
    const isJudge = Boolean(
        (applicationType === "judge" || judgeApp) &&
        application?.status === "accepted",
    );
    const isMentor = Boolean(applicationType === "mentor" || mentorApp);
    const isHacker = Boolean(
        applicationType === "hacker" ||
        hackerApp ||
        (application && !isJudge && !isMentor),
    );
    const isHackerRejected = isHacker && application?.status?.trim().toLowerCase() === "rejected";

    console.info("[application-access] status lookup", {
        userId,
        application,
        applicationError: applicationError
            ? {
                code: applicationError.code,
                message: applicationError.message,
                details: applicationError.details,
                hint: applicationError.hint,
            }
            : null,
        applicationType,
        applicationStatus: application?.status ?? null,
        hasHackerApplication: Boolean(hackerApp),
        hasJudgeApplication: Boolean(judgeApp),
        hasMentorApplication: Boolean(mentorApp),
        isHacker,
        isHackerRejected,
        isJudge,
        isMentor,
    });

    return {
        applicationType,
        applicationStatus: application?.status ?? null,
        isHacker,
        isHackerRejected,
        isJudge,
        isMentor,
    };
}