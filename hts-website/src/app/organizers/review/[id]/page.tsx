import Link from "next/link";
import { notFound } from "next/navigation";
import OrganizerReviewClient from "@/components/OrganizerReviewClient";
import { answersByQuestion, questionsForType } from "@/lib/grading/questions";
import type { ApplicationType } from "@/lib/grading/types";
import { requireOrganizer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

export default async function OrganizerReviewPage({ params }: PageProps) {
  const organizer = await requireOrganizer();
  const { id } = await params;
  const supabase = await createClient();

  const { data: application, error } = await supabase
    .from("applications")
    .select(
      "id, type, status, first_name, last_name, email, school_or_organization, details, answers, submitted_at",
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !application) notFound();

  const type = application.type as ApplicationType;
  const questions = questionsForType(type);

  const { data: grades } = await supabase
    .from("application_grades")
    .select("grader_id, scores")
    .eq("application_id", id);

  const own = grades?.find((grade) => grade.grader_id === organizer.id);
  const initialScores =
    own && typeof own.scores === "object" && own.scores !== null
      ? (own.scores as Record<string, number>)
      : {};

  return (
    <main className="min-h-screen px-5 py-10 font-outfit text-primary md:px-10">
      <div className="mx-auto max-w-[100rem]">
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <Link
            href="/organizers"
            className="rounded-full border border-primary/40 px-4 py-2 text-sm hover:bg-primary/10"
          >
            ← Back to list
          </Link>
          <span className="text-sm text-white/50">
            Submitted {new Date(application.submitted_at).toLocaleString()}
          </span>
        </div>
        <OrganizerReviewClient
          application={{
            ...application,
            type,
            status: application.status as "pending" | "accepted" | "rejected",
            answers: answersByQuestion(type, application.answers),
          }}
          questions={questions}
          initialScores={initialScores}
          graderCount={grades?.length ?? 0}
        />
      </div>
    </main>
  );
}
