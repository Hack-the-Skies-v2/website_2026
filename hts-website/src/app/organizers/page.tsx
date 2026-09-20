import Link from "next/link";
import OrganizerDashboard, {
  type OrganizerApplication,
} from "@/components/OrganizerDashboard";
import { questionsForType } from "@/lib/grading/questions";
import { averageComposite, compositeScore } from "@/lib/grading/scoring";
import type { ApplicationType } from "@/lib/grading/types";
import { requireOrganizer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type GradeRow = {
  application_id: string;
  grader_id: string;
  scores: Record<string, number> | null;
};

export default async function OrganizersPage() {
  const organizer = await requireOrganizer();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("applications")
    .select(
      "id, type, status, first_name, last_name, email, school_or_organization, details, answers, submitted_at, notification_sent_at, notification_error",
    )
    .order("submitted_at", { ascending: false });

  if (error) {
    throw new Error(
      "Could not load applications. Confirm the Supabase migration has been applied.",
    );
  }

  const { data: grades } = await supabase
    .from("application_grades")
    .select("application_id, grader_id, scores");

  const gradesByApplication = new Map<string, GradeRow[]>();
  for (const grade of (grades ?? []) as GradeRow[]) {
    const list = gradesByApplication.get(grade.application_id) ?? [];
    list.push(grade);
    gradesByApplication.set(grade.application_id, list);
  }

  const applications: OrganizerApplication[] = (data ?? []).map((row) => {
    const type = row.type as ApplicationType;
    const questions = questionsForType(type);
    const appGrades = gradesByApplication.get(row.id) ?? [];
    const scoreMaps = appGrades
      .map((grade) => grade.scores)
      .filter((scores): scores is Record<string, number> => !!scores && typeof scores === "object");
    const mine = appGrades.find((grade) => grade.grader_id === organizer.id);

    return {
      ...(row as Omit<OrganizerApplication, "average_score" | "grader_count" | "my_score">),
      type,
      status: row.status as OrganizerApplication["status"],
      average_score: averageComposite(scoreMaps, questions),
      grader_count: scoreMaps.filter((scores) => compositeScore(scores, questions) != null).length,
      my_score:
        mine?.scores && typeof mine.scores === "object"
          ? compositeScore(mine.scores as Record<string, number>, questions)
          : null,
    };
  });

  return (
    <main className="min-h-screen px-5 py-10 font-outfit text-primary md:px-10">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-pixel text-sm uppercase tracking-[0.2em] text-star">
              Hack the Skies · private
            </p>
            <h1 className="mt-3 text-4xl font-semibold">Organizer console</h1>
            <p className="mt-2 text-white/65">
              Signed in as {organizer.email}. Score answers, then accept or reject — decision emails send automatically for hackers and mentors.
            </p>
          </div>
          <Link
            href="/"
            className="rounded-full border border-primary/50 px-4 py-2 text-sm hover:bg-primary/10"
          >
            Public website
          </Link>
        </header>
        <OrganizerDashboard applications={applications} />
      </div>
    </main>
  );
}
