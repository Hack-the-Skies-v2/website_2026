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

function normalizeType(type: string): ApplicationType | null {
  const value = type.trim().toLowerCase();
  if (value === "hacker" || value === "mentor") return value;
  return null;
}

function mapStatus(status: string): OrganizerApplication["status"] {
  const value = status.trim().toLowerCase();
  if (value === "accepted") return "accepted";
  if (value === "rejected") return "rejected";
  return "pending";
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

export async function listOrganizerApplications(
  organizerId: string,
): Promise<OrganizerApplication[]> {
  const supabase = await createClient();

  const { data: apps, error } = await supabase
    .from("applications")
    .select(
      "id, type, status, email, first_name, last_name, school_or_organization, details, answers, submitted_at, notification_sent_at, notification_error",
    )
    .in("type", ["hacker", "mentor", "Hacker", "Mentor"])
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
  const [{ data: hackers }, { data: mentors }, gradesByApp] = await Promise.all([
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
    loadGradesByApp(supabase, ids),
  ]);

  const hackerById = new Map(((hackers ?? []) as HackerRow[]).map((row) => [row.user_id, row]));
  const mentorById = new Map(((mentors ?? []) as MentorRow[]).map((row) => [row.user_id, row]));

  return rows.flatMap((row): OrganizerApplication[] => {
    const type = normalizeType(row.type);
    if (!type) return [];

    const appGrades = gradesByApp.get(row.id) ?? [];
    const scores = scoreSummary(appGrades, organizerId, type);
    const fromAnswers = parseAnswers(row.answers, type);

    if (type === "hacker") {
      const hacker = hackerById.get(row.id);
      const answers =
        fromAnswers.some((text) => text.trim()) || !hacker
          ? fromAnswers.length
            ? fromAnswers
            : Array(questionsForType(type).length).fill("")
          : [
              hacker.application_questions_1,
              hacker.application_questions_2,
              hacker.application_questions_3,
              hacker.application_questions_4,
              hacker.application_questions_5,
            ];
      const firstName = row.first_name || hacker?.first_name || "";
      const lastName = row.last_name || hacker?.last_name || "";
      if (!firstName && !lastName && !row.email && !hacker) return [];

      return [
        {
          id: row.id,
          type: "hacker",
          status: mapStatus(row.status),
          first_name: firstName || "Applicant",
          last_name: lastName,
          email: row.email || "",
          school_or_organization: row.school_or_organization || hacker?.school_name || null,
          details: row.details,
          answers,
          submitted_at: row.submitted_at || new Date().toISOString(),
          notification_sent_at: row.notification_sent_at,
          notification_error: row.notification_error,
          ...scores,
        },
      ];
    }

    const mentor = mentorById.get(row.id);
    const mentorAnswers =
      fromAnswers.some((text) => text.trim()) || !mentor
        ? fromAnswers.length
          ? fromAnswers
          : Array(questionsForType(type).length).fill("")
        : [
            mentor.technologies_and_tools,
            mentor.mentoring_experience,
            mentor.mentoring_goals,
          ];

    let firstName = row.first_name || "";
    let lastName = row.last_name || "";
    if (!firstName && mentor?.name) {
      const parts = mentor.name.trim().split(/\s+/);
      firstName = parts[0] || mentor.name;
      lastName = parts.slice(1).join(" ");
    }
    if (!firstName && !lastName && !row.email && !mentor) return [];

    return [
      {
        id: row.id,
        type: "mentor",
        status: mapStatus(row.status),
        first_name: firstName || "Applicant",
        last_name: lastName,
        email: row.email || "",
        school_or_organization: row.school_or_organization || mentor?.university_college || null,
        details: row.details,
        answers: mentorAnswers,
        submitted_at: row.submitted_at || new Date().toISOString(),
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

  let review: ReviewApplication;

  if (type === "hacker") {
    const { data: hacker } = await supabase
      .from("hacker_applications")
      .select(
        "first_name, last_name, school_name, application_questions_1, application_questions_2, application_questions_3, application_questions_4, application_questions_5",
      )
      .eq("user_id", applicationId)
      .maybeSingle();

    const answers =
      fromAnswers.some((text) => text.trim()) || !hacker
        ? fromAnswers.length
          ? fromAnswers
          : Array(questions.length).fill("")
        : [
            hacker.application_questions_1,
            hacker.application_questions_2,
            hacker.application_questions_3,
            hacker.application_questions_4,
            hacker.application_questions_5,
          ];

    review = {
      id: applicationId,
      type,
      status: mapStatus(row.status),
      first_name: row.first_name || hacker?.first_name || "Applicant",
      last_name: row.last_name || hacker?.last_name || "",
      email: row.email || "",
      school_or_organization: row.school_or_organization || hacker?.school_name || null,
      details: row.details,
      answers: answersByQuestion(type, answers),
      submitted_at: row.submitted_at || new Date().toISOString(),
    };
  } else {
    const { data: mentor } = await supabase
      .from("mentor_applications")
      .select(
        "name, university_college, technologies_and_tools, mentoring_experience, mentoring_goals",
      )
      .eq("user_id", applicationId)
      .maybeSingle();

    let firstName = row.first_name || "";
    let lastName = row.last_name || "";
    if (!firstName && mentor?.name) {
      const parts = mentor.name.trim().split(/\s+/);
      firstName = parts[0] || mentor.name;
      lastName = parts.slice(1).join(" ");
    }

    const answers =
      fromAnswers.some((text) => text.trim()) || !mentor
        ? fromAnswers.length
          ? fromAnswers
          : Array(questions.length).fill("")
        : [
            mentor.technologies_and_tools,
            mentor.mentoring_experience,
            mentor.mentoring_goals,
          ];

    review = {
      id: applicationId,
      type,
      status: mapStatus(row.status),
      first_name: firstName || "Applicant",
      last_name: lastName,
      email: row.email || "",
      school_or_organization: row.school_or_organization || mentor?.university_college || null,
      details: row.details,
      answers: answersByQuestion(type, answers),
      submitted_at: row.submitted_at || new Date().toISOString(),
    };
  }

  const [{ data: grades }, list] = await Promise.all([
    supabase
      .from("application_grades")
      .select("grader_id, scores")
      .eq("application_user_id", applicationId),
    listOrganizerApplications(organizerId),
  ]);

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
