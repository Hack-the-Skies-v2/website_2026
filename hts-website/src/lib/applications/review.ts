import "server-only";

import { createClient } from "@/lib/supabase/server";
import {
  answersByQuestion,
  hackerQuestionsForStoredAnswers,
  questionsForType,
} from "@/lib/grading/questions";
import { averageComposite, compositeScore } from "@/lib/grading/scoring";
import type { ApplicationType, Question } from "@/lib/grading/types";
import type { OrganizerApplication } from "@/components/OrganizerDashboard";
import type { ReviewApplication, ReviewInfoField } from "@/components/OrganizerReviewClient";

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
  first_name: string | null;
  last_name: string | null;
  preferred_name: string | null;
  phone_number: string | null;
  date_of_birth: string | null;
  t_shirt_size: string | null;
  city: string | null;
  province: string | null;
  dietary_restrictions: string[] | null;
  dietary_other: string | null;
  accessibility_accommodations: string[] | null;
  accessibility_other: string | null;
  school_name: string | null;
  grade: string | null;
  graduation_year: string | null;
  school_city: string | null;
  hackathon_experience: string | null;
  heard_about_hts: string | null;
  heard_about_hts_other: string | null;
  application_questions_1: string | null;
  application_questions_2: string | null;
  application_questions_3: string | null;
  application_questions_4: string | null;
  application_questions_5: string | null;
};

type MentorRow = {
  user_id: string;
  name: string | null;
  university_college: string | null;
  program_and_year_of_study: string | null;
  linkedin_portfolio_github_url: string | null;
  mentoring_areas: string[] | null;
  technologies_and_tools: string | null;
  mentoring_experience: string | null;
  mentoring_goals: string | null;
  available_for_full_event: boolean | null;
  times_unavailable: string | null;
};

type JudgeRow = {
  user_id: string;
  name: string | null;
  company_organization: string | null;
  job_title: string | null;
  linkedin_url: string | null;
  industry_field: string | null;
  expertise: string[] | null;
  years_of_professional_experience: string | null;
  strong_project_description: string | null;
  professional_background: string | null;
  judging_experience: string | null;
  available_for_full_judging_period: boolean | null;
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

function asText(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.map((item) => String(item)).filter(Boolean).join(", ");
  return String(value).trim();
}

function pushField(fields: ReviewInfoField[], label: string, value: unknown) {
  const text = asText(value);
  if (!text) return;
  fields.push({ label, value: text });
}

function recordFromUnknown(raw: unknown): Record<string, unknown> {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    return raw as Record<string, unknown>;
  }
  return {};
}

function parseAnswers(raw: unknown, type: ApplicationType): string[] {
  const count = questionsForType(type).length;
  if (Array.isArray(raw)) {
    return raw.map((answer) => (typeof answer === "string" ? answer : String(answer ?? "")));
  }
  if (raw && typeof raw === "object") {
    const record = raw as Record<string, unknown>;
    const byId = questionsForType(type).map((question) => {
      const value = record[question.id];
      return typeof value === "string" ? value : value != null ? String(value) : "";
    });
    if (byId.some((text) => text.trim())) {
      if (type === "hacker") {
        const legacy = [1, 2, 3, 4, 5].map((n) => {
          const value = record[`hacker-q${n}`] ?? record[`application_questions_${n}`];
          return typeof value === "string" ? value : value != null ? String(value) : "";
        });
        if (legacy.slice(2).some((text) => text.trim())) return legacy;
      }
      return byId;
    }

    if (type === "mentor") {
      const mentorKeyed = [
        record.technologiesAndTools ?? record.technologies_and_tools,
        record.mentoringExperience ?? record.mentoring_experience,
        record.mentoringGoals ?? record.mentoring_goals,
      ].map(asText);
      if (mentorKeyed.some((text) => text)) return mentorKeyed;
    }
    if (type === "judge") {
      const judgeKeyed = [
        record.strongProjectDescription ?? record.strong_project_description,
        record.professionalBackground ?? record.professional_background,
        record.judgingExperience ?? record.judging_experience,
      ].map(asText);
      if (judgeKeyed.some((text) => text)) return judgeKeyed;
    }
    if (type === "hacker" && Array.isArray(record.applicationQuestions)) {
      return (record.applicationQuestions as unknown[]).map(asText);
    }
  }
  return Array(count).fill("");
}

function scoreSummary(
  appGrades: GradeRow[],
  organizerId: string,
  questions: Question[],
) {
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

function pickAnswers(fromAnswers: string[], fallback: string[] | null, type: ApplicationType): string[] {
  if (fromAnswers.some((text) => text.trim())) return fromAnswers;
  if (fallback?.some((text) => text.trim())) return fallback;
  return fromAnswers.length ? fromAnswers : Array(questionsForType(type).length).fill("");
}

function buildHackerInfo(row: AppRow, hacker: HackerRow | undefined): ReviewInfoField[] {
  const answers = recordFromUnknown(row.answers);
  const details = recordFromUnknown(row.details);
  const bag = { ...details, ...answers };
  const fields: ReviewInfoField[] = [];

  pushField(fields, "Preferred name", hacker?.preferred_name ?? bag.preferredName);
  pushField(fields, "Pronouns", bag.pronouns);
  pushField(fields, "Pronouns (other)", bag.pronounsOther ?? bag.pronouns_other);
  pushField(fields, "Phone", hacker?.phone_number ?? bag.phoneNumber);
  pushField(fields, "Date of birth", hacker?.date_of_birth ?? bag.dateOfBirth);
  pushField(fields, "T-shirt size", hacker?.t_shirt_size ?? bag.tShirtSize);
  pushField(fields, "City", hacker?.city ?? bag.city);
  pushField(fields, "Province", hacker?.province ?? bag.province);
  pushField(fields, "Applying with teammates", bag.teammates);
  pushField(fields, "Dietary restrictions", hacker?.dietary_restrictions ?? bag.dietaryRestrictions);
  pushField(fields, "Dietary (other)", hacker?.dietary_other ?? bag.dietaryOther);
  pushField(
    fields,
    "Accessibility accommodations",
    hacker?.accessibility_accommodations ?? bag.accessibilityAccommodations,
  );
  pushField(
    fields,
    "Accessibility (other)",
    hacker?.accessibility_other ?? bag.accessibilityOther,
  );
  pushField(fields, "School", hacker?.school_name ?? bag.schoolName);
  pushField(fields, "Grade", hacker?.grade ?? bag.grade);
  pushField(fields, "Graduation year", hacker?.graduation_year ?? bag.graduationYear);
  pushField(fields, "School city", hacker?.school_city ?? bag.schoolCity);
  pushField(fields, "Coding experience", bag.codingExperience ?? bag.coding_experience);
  pushField(fields, "Goals", bag.goals);
  pushField(fields, "Goals (other)", bag.goalsOther ?? bag.goals_other);
  pushField(fields, "Want to see at HTS", bag.wantToSee ?? bag.want_to_see);
  pushField(fields, "Favourite song", bag.favouriteSong ?? bag.favourite_song);
  pushField(fields, "Heard about HTS", hacker?.heard_about_hts ?? bag.heardAboutHTS);
  pushField(
    fields,
    "Heard about HTS (other)",
    hacker?.heard_about_hts_other ?? bag.heardAboutHTSOther,
  );
  pushField(fields, "Hackathon experience", hacker?.hackathon_experience ?? bag.hackathonExperience);
  pushField(fields, "LinkedIn / Portfolio", bag.linkedinPortfolio ?? bag.linkedin_portfolio);
  pushField(fields, "GitHub / Devpost", bag.githubDevpost ?? bag.github_devpost);
  pushField(fields, "Resume", bag.resumeName ?? bag.resume_name ?? bag.resumePath);
  pushField(fields, "Other comments", bag.otherComments ?? bag.other_comments);
  return fields;
}

function buildMentorInfo(row: AppRow, mentor: MentorRow | undefined): ReviewInfoField[] {
  const bag = { ...recordFromUnknown(row.details), ...recordFromUnknown(row.answers) };
  const fields: ReviewInfoField[] = [];
  pushField(fields, "Program / year", mentor?.program_and_year_of_study ?? bag.programAndYear);
  pushField(
    fields,
    "LinkedIn / Portfolio / GitHub",
    mentor?.linkedin_portfolio_github_url ?? bag.linkedinPortfolioGithub,
  );
  pushField(fields, "Mentoring areas", mentor?.mentoring_areas ?? bag.areas);
  pushField(
    fields,
    "Available for full event",
    mentor?.available_for_full_event ?? bag.availableForFullEvent,
  );
  pushField(fields, "Times unavailable", mentor?.times_unavailable ?? bag.timesUnavailable);
  pushField(fields, "University / college", mentor?.university_college ?? bag.universityCollege);
  return fields;
}

function buildJudgeInfo(row: AppRow, judge: JudgeRow | undefined): ReviewInfoField[] {
  const bag = { ...recordFromUnknown(row.details), ...recordFromUnknown(row.answers) };
  const fields: ReviewInfoField[] = [];
  pushField(fields, "Company / organization", judge?.company_organization ?? bag.companyOrganization);
  pushField(fields, "Job title", judge?.job_title ?? bag.jobTitle);
  pushField(fields, "LinkedIn", judge?.linkedin_url ?? bag.linkedinUrl);
  pushField(fields, "Industry / field", judge?.industry_field ?? bag.industryField);
  pushField(fields, "Expertise", judge?.expertise ?? bag.areas);
  pushField(
    fields,
    "Years of experience",
    judge?.years_of_professional_experience ?? bag.yearsOfExperience,
  );
  pushField(
    fields,
    "Available for full judging period",
    judge?.available_for_full_judging_period ?? bag.availableForFullJudgingPeriod,
  );
  return fields;
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
          "user_id, first_name, last_name, preferred_name, phone_number, date_of_birth, t_shirt_size, city, province, dietary_restrictions, dietary_other, accessibility_accommodations, accessibility_other, school_name, grade, graduation_year, school_city, hackathon_experience, heard_about_hts, heard_about_hts_other, application_questions_1, application_questions_2, application_questions_3, application_questions_4, application_questions_5",
        )
        .in("user_id", ids),
      supabase
        .from("mentor_applications")
        .select(
          "user_id, name, university_college, program_and_year_of_study, linkedin_portfolio_github_url, mentoring_areas, technologies_and_tools, mentoring_experience, mentoring_goals, available_for_full_event, times_unavailable",
        )
        .in("user_id", ids),
      supabase
        .from("judge_applications")
        .select(
          "user_id, name, company_organization, job_title, linkedin_url, industry_field, expertise, years_of_professional_experience, strong_project_description, professional_background, judging_experience, available_for_full_judging_period",
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
    const fromAnswers = parseAnswers(row.answers, type);
    const submittedAt = row.submitted_at || new Date().toISOString();

    if (type === "hacker") {
      const hacker = hackerById.get(row.id);
      const answers = pickAnswers(
        fromAnswers,
        hacker
          ? [
              hacker.application_questions_1 || "",
              hacker.application_questions_2 || "",
              hacker.application_questions_3 || "",
              hacker.application_questions_4 || "",
              hacker.application_questions_5 || "",
            ]
          : null,
        type,
      );
      const questions = hackerQuestionsForStoredAnswers(answers);
      const scores = scoreSummary(appGrades, organizerId, questions);
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
          answers: answers.slice(0, questions.length),
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
              mentor.technologies_and_tools || "",
              mentor.mentoring_experience || "",
              mentor.mentoring_goals || "",
            ]
          : null,
        type,
      );
      const scores = scoreSummary(appGrades, organizerId, questionsForType(type));
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
            judge.strong_project_description || "",
            judge.professional_background || "",
            judge.judging_experience || "",
          ]
        : null,
      type,
    );
    const scores = scoreSummary(appGrades, organizerId, questionsForType(type));
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
  questions: Question[];
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
  const fromAnswers = parseAnswers(row.answers, type);
  const list = await listOrganizerApplications(organizerId);
  const listed = list.find((item) => item.id === applicationId);

  let info: ReviewInfoField[] = [];
  let answerTexts = (listed?.answers as string[] | undefined) ?? fromAnswers;

  if (type === "hacker") {
    const { data: hacker } = await supabase
      .from("hacker_applications")
      .select(
        "user_id, first_name, last_name, preferred_name, phone_number, date_of_birth, t_shirt_size, city, province, dietary_restrictions, dietary_other, accessibility_accommodations, accessibility_other, school_name, grade, graduation_year, school_city, hackathon_experience, heard_about_hts, heard_about_hts_other, application_questions_1, application_questions_2, application_questions_3, application_questions_4, application_questions_5",
      )
      .eq("user_id", applicationId)
      .maybeSingle();
    const hackerRow = hacker as HackerRow | null;
    answerTexts = pickAnswers(
      fromAnswers,
      hackerRow
        ? [
            hackerRow.application_questions_1 || "",
            hackerRow.application_questions_2 || "",
            hackerRow.application_questions_3 || "",
            hackerRow.application_questions_4 || "",
            hackerRow.application_questions_5 || "",
          ]
        : null,
      type,
    );
    info = buildHackerInfo(row, hackerRow ?? undefined);
  } else if (type === "mentor") {
    const { data: mentor } = await supabase
      .from("mentor_applications")
      .select(
        "user_id, name, university_college, program_and_year_of_study, linkedin_portfolio_github_url, mentoring_areas, technologies_and_tools, mentoring_experience, mentoring_goals, available_for_full_event, times_unavailable",
      )
      .eq("user_id", applicationId)
      .maybeSingle();
    const mentorRow = mentor as MentorRow | null;
    answerTexts = pickAnswers(
      fromAnswers,
      mentorRow
        ? [
            mentorRow.technologies_and_tools || "",
            mentorRow.mentoring_experience || "",
            mentorRow.mentoring_goals || "",
          ]
        : null,
      type,
    );
    info = buildMentorInfo(row, mentorRow ?? undefined);
  } else {
    const { data: judge } = await supabase
      .from("judge_applications")
      .select(
        "user_id, name, company_organization, job_title, linkedin_url, industry_field, expertise, years_of_professional_experience, strong_project_description, professional_background, judging_experience, available_for_full_judging_period",
      )
      .eq("user_id", applicationId)
      .maybeSingle();
    const judgeRow = judge as JudgeRow | null;
    answerTexts = pickAnswers(
      fromAnswers,
      judgeRow
        ? [
            judgeRow.strong_project_description || "",
            judgeRow.professional_background || "",
            judgeRow.judging_experience || "",
          ]
        : null,
      type,
    );
    info = buildJudgeInfo(row, judgeRow ?? undefined);
  }

  const questions =
    type === "hacker" ? hackerQuestionsForStoredAnswers(answerTexts) : questionsForType(type);

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
    answers: answersByQuestion(type, answerTexts.slice(0, questions.length), questions),
    info,
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
