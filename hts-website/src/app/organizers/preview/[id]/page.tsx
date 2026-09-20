import { notFound } from "next/navigation";
import Link from "next/link";
import OrganizerReviewClient from "@/components/OrganizerReviewClient";
import {
  getMockOrganizerApplications,
  getMockReviewApplication,
} from "@/lib/grading/mock-applications";
import {
  hackerQuestionsForStoredAnswers,
  questionsForType,
} from "@/lib/grading/questions";
import {
  advanceAfterDecision,
  prioritizeForReview,
  queuePosition,
} from "@/lib/grading/queue";

type PageProps = { params: Promise<{ id: string }> };

export default async function OrganizerPreviewReviewPage({ params }: PageProps) {
  const { id } = await params;
  const application = getMockReviewApplication(id);
  if (!application) notFound();

  const questions =
    application.type === "hacker"
      ? hackerQuestionsForStoredAnswers(application.answers.map((row) => row.text))
      : questionsForType(application.type);
  const trackPeers = getMockOrganizerApplications().filter(
    (row) => row.type === application.type,
  );

  const prioritized = prioritizeForReview(
    trackPeers.map((peer) => ({
      id: peer.id,
      status: peer.status,
      submitted_at: peer.submitted_at,
      grader_count: peer.grader_count,
      graded_by_me: peer.my_score != null,
    })),
  );

  const allIds = prioritized.map((peer) => peer.id);
  const pendingIds = prioritized
    .filter((peer) => peer.status === "pending")
    .map((peer) => peer.id);
  const queue = queuePosition(allIds, id);
  const advanceId = advanceAfterDecision(allIds, pendingIds, id);
  const href = (peerId: string) => `/organizers/preview/${peerId}`;

  return (
    <main className="min-h-screen px-5 py-10 font-outfit text-primary md:px-10">
      <div className="mx-auto max-w-[100rem]">
        <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-white/50">
          <span className="rounded-full bg-star/20 px-3 py-1 text-xs font-medium text-star">
            Preview · mock data
          </span>
          <Link
            href="/organizers"
            className="rounded-full border border-primary/40 px-3 py-1 text-xs font-medium text-primary hover:bg-primary/10"
          >
            ← Live organizer console
          </Link>
          <Link
            href="/organizers/preview"
            className="rounded-full border border-primary/40 px-3 py-1 text-xs font-medium text-primary hover:bg-primary/10"
          >
            Mock list
          </Link>
          <span>Use the Questions / Details tabs below</span>
          <span>Submitted {new Date(application.submitted_at).toLocaleString()}</span>
        </div>
        <OrganizerReviewClient
          application={application}
          questions={questions}
          initialScores={{}}
          graderCount={0}
          preview
          listHref="/organizers/preview"
          previousHref={queue.previousId ? href(queue.previousId) : null}
          nextHref={queue.nextId ? href(queue.nextId) : null}
          advanceHref={advanceId ? href(advanceId) : "/organizers/preview"}
          position={queue.position}
          total={queue.total}
        />
      </div>
    </main>
  );
}
