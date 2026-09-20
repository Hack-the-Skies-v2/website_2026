import "server-only";

import { createClient } from "@/lib/supabase/server";
import { answersByQuestion, questionsForType } from "@/lib/grading/questions";
import { averageComposite, compositeScore } from "@/lib/grading/scoring";
import type { ApplicationType } from "@/lib/grading/types";
import type { OrganizerApplication } from "@/components/OrganizerDashboard";
import type { ReviewApplication } from "@/components/OrganizerReviewClient";

/** Live portal applications table (prod schema). */
type AppRow = {
  id: string;
  type: string;
  status: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  school_or_organization: string | null;
  details: string | null;
  answers: unknown;
  submitted_at: string | null;
  notification_sent_at: string | null;
  notification_error: string | null;
};

type GradeRow = {
  application_user_id: string;
  grader_id: string;
  scores: Record<string, number> | null;
};

type HackerRow = {
  user_id: string;
  first_name: string;
  last_name: string;
  school_name: string;
  application_questions_1: string;
  application_questions_2: string;
  application_questions_3: string;
  application_questions_4: string;
  application_questions_5: string;
};

type MentorRow = {
  user_id: string;
  name: string;
  university_college: string;
  technologies_and_tools: string;
  mentoring_experience: string;
  mentoring_goals: string;
};

type JudgeRow = {
  user_id: string;
  name: string;
  company_organization: string;
  job_title: string;
  strong_project_description: string;
  professional_background: string;
  judging_experience: string;
};

const TYPE_VALUES = [
  "hacker",
  "mentor",
  "judge",
  "Hacker",
  "Mentor",
  "Judge",
] as const;

function normalizeType(type: string): ApplicationType | null {
  const value = type.trim().toLowerCase();
  if (value === "hacker" || value === "mentor" || value === "judge") return value;
  return null;
}

function mapStatus(status: string): OrganizerApplication["status"] {
  const value = status.trim().toLowerCase();
  if (value === "accepted") return "accepted";
  if (value === "rejected") return "rejected";
  return "pending";
}

function splitName(name: string | null | undefined): { first: string; last: string } {
  const trimmed = name?.trim() || "";
  if (!trimmed) return { first: "", last: "" };
  const parts = trimmed.split(/\s+/);
  return { first: parts[0] || trimmed, last: parts.slice(1).join(" ") };
}

function parseAnswers(raw: unknown, type: ApplicationType): string[] {
  const count = questionsForType(type).length;
  if (Array.isArray(raw)) {
    return raw
      .slice(0, count)
      .map((answer) => (typeof answer === "string" ? answer : String(answer ?? "")));
  }
  if (raw && typeof raw === "object") {
    const record = raw as Record<string, unknown>;
    const questions = questionsForType(type);
    const byId = questions.map((question) => {
      const value = record[question.id];
      return typeof value === "string" ? value : value != null ? String(value) : "";
    });
    if (byId.some((text) => text.trim())) return byId;

    const keyed = [
      record.technologiesAndTools ?? record.technologies_and_tools,
      record.mentoringExperience ?? record.mentoring_experience,
      record.mentoringGoals ?? record.mentoring_goals,
      record.strongProjectDescription ?? record.strong_project_description,
      record.professionalBackground ?? record.professional_background,
      record.judgingExperience ?? record.judging_experience,
    ]
      .map((value) => (typeof value === "string" ? value : value != null ? String(value) : ""))
      .filter((text) => text.trim());
    if (type === "mentor" && keyed.length >= 3) return keyed.slice(0, 3);
    if (type === "judge") {
      const judgeKeyed = [
        record.strongProjectDescription ?? record.strong_project_description,
        record.professionalBackground ?? record.professional_background,
        record.judgingExperience ?? record.judging_experience,
      ].map((value) => (typeof value === "string" ? value : value != null ? String(value) : ""));
      if (judgeKeyed.some((text) => text.trim())) return judgeKeyed;
    }
  }
  return [];
}

function scoreSummary(
  appGrades: GradeRow[],
  organizerId: string,
  type: ApplicationType,
) {
  const questions = questionsForType(type);
  const scoreMaps = appGrades
    .map((grade) => grade.scores)
    .filter((scores): scores is Record<string, number> => !!scores && typeof scores === "object");
  const mine = appGrades.find((grade) => grade.grader_id === organizerId);
  return {
    average_score: averageComposite(scoreMaps, questions),
    grader_count: scoreMaps.filter((scores) => compositeScore(scores, questions) != null).length,
    my_score:
      mine?.scores && typeof mine.scores === "object"
        ? compositeScore(mine.scores, questions)
        : null,
  };
}

async function loadGradesByApp(
  supabase: Awaited<ReturnType<typeof createClient>>,
  ids: string[],
): Promise<Map<string, GradeRow[]>> {
  const gradesByApp = new Map<string, GradeRow[]>();
  if (ids.length === 0) return gradesByApp;

  const { data: grades, error } = await supabase
    .from("application_grades")
    .select("application_user_id, grader_id, scores")
    .in("application_user_id", ids);

  if (error || !grades) return gradesByApp;

  for (const grade of grades as GradeRow[]) {
    const list = gradesByApp.get(grade.application_user_id) ?? [];
    list.push(grade);
    gradesByApp.set(grade.application_user_id, list);
  }
  return gradesByApp;
}

function emptyAnswers(type: ApplicationType): string[] {
  return Array(questionsForType(type).length).fill("");
}

function pickAnswers(
  fromAnswers: string[],
  fallback: string[] | null,
  type: ApplicationType,
): string[] {
  if (fromAnswers.some((text) => text.trim())) return fromAnswers;
  if (fallback?.some((text) => text.trim())) return fallback;
  return fromAnswers.length ? fromAnswers : emptyAnswers(type);
}

export async function listOrganizerApplications(
  organizerId: string,
): Promise<OrganizerApplication[]> {
  const supabase = await createClient();

  const { data: apps, error } = await supabase
    .from("applications")
    .select(
      "id, type, status, email, first_name, last_name, school_or_organization, details, answers, submitted_at, notification_sent_at, notification_error",
    )
    .in("type", [...TYPE_VALUES])
    .neq("status", "draft")
    .neq("status", "Draft")
    .order("submitted_at", { ascending: false });

  if (error) {
    throw new Error(
      `Could not load applications (${error.message}). Confirm you are an admin and the organizer grades migration is applied.`,
    );
  }

  const rows = ((apps ?? []) as AppRow[]).filter((row) => normalizeType(row.type));
  if (rows.length === 0) return [];

  const ids = rows.map((row) => row.id);
  const [{ data: hackers }, { data: mentors }, { data: judges }, gradesByApp] =
    await Promise.all([
      supabase
        .from("hacker_applications")
        .select(
          "user_id, first_name, last_name, school_name, application_questions_1, application_questions_2, application_questions_3, application_questions_4, application_questions_5",
        )
        .in("user_id", ids),
      supabase
        .from("mentor_applications")
        .select(
          "user_id, name, university_college, technologies_and_tools, mentoring_experience, mentoring_goals",
        )
        .in("user_id", ids),
      supabase
        .from("judge_applications")
        .select(
          "user_id, name, company_organization, job_title, strong_project_description, professional_background, judging_experience",
        )
        .in("user_id", ids),
      loadGradesByApp(supabase, ids),
    ]);

  const hackerById = new Map(((hackers ?? []) as HackerRow[]).map((row) => [row.user_id, row]));
  const mentorById = new Map(((mentors ?? []) as MentorRow[]).map((row) => [row.user_id, row]));
  const judgeById = new Map(((judges ?? []) as JudgeRow[]).map((row) => [row.user_id, row]));

  return rows.flatMap((row): OrganizerApplication[] => {
    const type = normalizeType(row.type);
    if (!type) return [];

    const appGrades = gradesByApp.get(row.id) ?? [];
    const scores = scoreSummary(appGrades, organizerId, type);
    const fromAnswers = parseAnswers(row.answers, type);
    const submittedAt = row.submitted_at || new Date().toISOString();

    if (type === "hacker") {
      const hacker = hackerById.get(row.id);
      const answers = pickAnswers(
        fromAnswers,
        hacker
          ? [
              hacker.application_questions_1,
              hacker.application_questions_2,
              hacker.application_questions_3,
              hacker.application_questions_4,
              hacker.application_questions_5,
            ]
          : null,
        type,
      );
      return [
        {
          id: row.id,
          type: "hacker",
          status: mapStatus(row.status),
          first_name: row.first_name || hacker?.first_name || "Applicant",
          last_name: row.last_name || hacker?.last_name || "",
          email: row.email || "",
          school_or_organization: row.school_or_organization || hacker?.school_name || null,
          details: row.details,
          answers,
          submitted_at: submittedAt,
          notification_sent_at: row.notification_sent_at,
          notification_error: row.notification_error,
          ...scores,
        },
      ];
    }

    if (type === "mentor") {
      const mentor = mentorById.get(row.id);
      const nameParts = splitName(mentor?.name || undefined);
      const answers = pickAnswers(
        fromAnswers,
        mentor
          ? [
              mentor.technologies_and_tools,
              mentor.mentoring_experience,
              mentor.mentoring_goals,
            ]
          : null,
        type,
      );
      return [
        {
          id: row.id,
          type: "mentor",
          status: mapStatus(row.status),
          first_name: row.first_name || nameParts.first || "Applicant",
          last_name: row.last_name || nameParts.last,
          email: row.email || "",
          school_or_organization:
            row.school_or_organization || mentor?.university_college || null,
          details: row.details,
          answers,
          submitted_at: submittedAt,
          notification_sent_at: row.notification_sent_at,
          notification_error: row.notification_error,
          ...scores,
        },
      ];
    }

    const judge = judgeById.get(row.id);
    const nameParts = splitName(judge?.name || undefined);
    const answers = pickAnswers(
      fromAnswers,
      judge
        ? [
            judge.strong_project_description,
            judge.professional_background,
            judge.judging_experience,
          ]
        : null,
      type,
    );
    const org =
      row.school_or_organization ||
      [judge?.company_organization, judge?.job_title].filter(Boolean).join(" · ") ||
      null;

    return [
      {
        id: row.id,
        type: "judge",
        status: mapStatus(row.status),
        first_name: row.first_name || nameParts.first || "Applicant",
        last_name: row.last_name || nameParts.last,
        email: row.email || "",
        school_or_organization: org,
        details: row.details,
        answers,
        submitted_at: submittedAt,
        notification_sent_at: row.notification_sent_at,
        notification_error: row.notification_error,
        ...scores,
      },
    ];
  });
}

export async function getOrganizerReviewApplication(
  applicationId: string,
  organizerId: string,
): Promise<{
  application: ReviewApplication;
  questions: ReturnType<typeof questionsForType>;
  initialScores: Record<string, number>;
  graderCount: number;
  allIds: string[];
  pendingIds: string[];
} | null> {
  const supabase = await createClient();
  const { data: app, error } = await supabase
    .from("applications")
    .select(
      "id, type, status, email, first_name, last_name, school_or_organization, details, answers, submitted_at, notification_sent_at, notification_error",
    )
    .eq("id", applicationId)
    .maybeSingle();

  if (error || !app) return null;
  const type = normalizeType((app as AppRow).type);
  if (!type) return null;

  const row = app as AppRow;
  const questions = questionsForType(type);
  const fromAnswers = parseAnswers(row.answers, type);
  const list = await listOrganizerApplications(organizerId);
  const listed = list.find((item) => item.id === applicationId);

  const review: ReviewApplication = {
    id: applicationId,
    type,
    status: mapStatus(row.status),
    first_name: listed?.first_name || row.first_name || "Applicant",
    last_name: listed?.last_name || row.last_name || "",
    email: listed?.email || row.email || "",
    school_or_organization:
      listed?.school_or_organization || row.school_or_organization || null,
    details: row.details,
    answers: answersByQuestion(type, listed?.answers ?? fromAnswers),
    submitted_at: row.submitted_at || listed?.submitted_at || new Date().toISOString(),
  };

  const { data: grades } = await supabase
    .from("application_grades")
    .select("grader_id, scores")
    .eq("application_user_id", applicationId);

  const gradeRows = (grades ?? []) as Pick<GradeRow, "grader_id" | "scores">[];
  const own = gradeRows.find((grade) => grade.grader_id === organizerId);
  const initialScores =
    own && typeof own.scores === "object" && own.scores !== null
      ? (own.scores as Record<string, number>)
      : {};

  const sameTrack = list.filter((rowItem) => rowItem.type === type);
  const allIds = sameTrack.map((rowItem) => rowItem.id);
  const pendingIds = sameTrack
    .filter((rowItem) => rowItem.status === "pending")
    .map((rowItem) => rowItem.id);

  return {
    application: review,
    questions,
    initialScores,
    graderCount: gradeRows.length,
    allIds,
    pendingIds,
  };
}
