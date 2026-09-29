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
    <main className="min-h-screen bg-white px-6 py-10 font-sans text-neutral-900 md:px-12">
      <div className="mx-auto max-w-[100rem]">
        <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-neutral-500">
          <span className="rounded-md border border-neutral-200 bg-neutral-100 px-2.5 py-1 text-xs text-neutral-700">
            Preview · mock data
          </span>
          <Link
            href="/organizers"
            className="rounded-md border border-neutral-300 bg-white px-3 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900"
          >
            ← Live organizer console
          </Link>
          <Link
            href="/organizers/preview"
            className="rounded-md border border-neutral-300 bg-white px-3 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900"
          >
            Mock list
          </Link>
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
