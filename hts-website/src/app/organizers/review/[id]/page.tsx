import Link from "next/link";
import { notFound } from "next/navigation";
import OrganizerReviewClient from "@/components/OrganizerReviewClient";
import {
  getOrganizerReviewApplication,
  listOrganizerApplications,
} from "@/lib/applications/review";
import {
  advanceAfterDecision,
  prioritizeForReview,
  queuePosition,
} from "@/lib/grading/queue";
import { requireOrganizer } from "@/lib/auth";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

export default async function OrganizerReviewPage({ params }: PageProps) {
  const organizer = await requireOrganizer();
  const { id } = await params;
  const loaded = await getOrganizerReviewApplication(id, organizer.id);
  if (!loaded) notFound();

  const list = await listOrganizerApplications(organizer.id);
  const trackPeers = list.filter((row) => row.type === loaded.application.type);
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
  const href = (peerId: string) => `/organizers/review/${peerId}`;

  return (
    <main className="min-h-screen px-5 py-10 font-outfit text-primary md:px-10">
      <div className="mx-auto max-w-[100rem]">
        <div className="mb-4 text-sm text-white/50">
          Submitted {new Date(loaded.application.submitted_at).toLocaleString()}
          <span className="ml-3 text-white/35">
            Queue: ungraded first, most graded last
          </span>
          <Link href="/organizers" className="ml-3 text-primary hover:underline">
            All lists
          </Link>
        </div>
        <OrganizerReviewClient
          application={loaded.application}
          questions={loaded.questions}
          initialScores={loaded.initialScores}
          graderCount={loaded.graderCount}
          listHref="/organizers"
          previousHref={queue.previousId ? href(queue.previousId) : null}
          nextHref={queue.nextId ? href(queue.nextId) : null}
          advanceHref={advanceId ? href(advanceId) : "/organizers"}
          position={queue.position}
          total={queue.total}
        />
      </div>
    </main>
  );
}
