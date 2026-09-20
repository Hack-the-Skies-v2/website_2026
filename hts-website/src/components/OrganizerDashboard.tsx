"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { decideApplications, type OrganizerDecision } from "@/actions/organizerDecisions";
import { sendPreviewDecisionEmails } from "@/actions/sendPreviewDecisionEmails";
import { prioritizeForReview } from "@/lib/grading/queue";

export type OrganizerApplication = {
  id: string;
  type: "hacker" | "mentor";
  status: "pending" | "accepted" | "rejected";
  first_name: string;
  last_name: string;
  email: string;
  school_or_organization: string | null;
  details: unknown;
  answers: unknown;
  submitted_at: string;
  notification_sent_at: string | null;
  notification_error: string | null;
  average_score: number | null;
  grader_count: number;
  my_score: number | null;
};

type Track = OrganizerApplication["type"];
type StatusBucket = OrganizerApplication["status"];

const TABLES: {
  status: StatusBucket;
  title: string;
  subtitle: string;
  activeClass: string;
}[] = [
  {
    status: "pending",
    title: "Pending",
    subtitle: "Not sure / still deciding. Least graded apps shown first",
    activeClass: "bg-amber-400 text-[#201b38]",
  },
  {
    status: "accepted",
    title: "Accepted",
    subtitle: "Accepted applicants",
    activeClass: "bg-emerald-400 text-[#201b38]",
  },
  {
    status: "rejected",
    title: "Rejected",
    subtitle: "Rejected applicants",
    activeClass: "bg-rose-400 text-[#201b38]",
  },
];

export default function OrganizerDashboard({
  applications,
  reviewBasePath = "/organizers/review",
  preview = false,
}: {
  applications: OrganizerApplication[];
  reviewBasePath?: string;
  preview?: boolean;
}) {
  const [track, setTrack] = useState<Track>("hacker");
  const [statusBucket, setStatusBucket] = useState<StatusBucket>("pending");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [notice, setNotice] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const forTrack = useMemo(
    () => applications.filter((application) => application.type === track),
    [applications, track],
  );

  const filtered = useMemo(() => {
    const needle = query.toLowerCase();
    const pool = !needle
      ? forTrack
      : forTrack.filter((application) =>
          `${application.first_name} ${application.last_name} ${application.email} ${application.school_or_organization ?? ""}`
            .toLowerCase()
            .includes(needle),
        );

    return prioritizeForReview(
      pool.map((application) => ({
        ...application,
        graded_by_me: application.my_score != null,
      })),
    );
  }, [forTrack, query]);

  const byStatus = {
    pending: filtered.filter((application) => application.status === "pending"),
    accepted: filtered.filter((application) => application.status === "accepted"),
    rejected: filtered.filter((application) => application.status === "rejected"),
  };

  const visible = byStatus[statusBucket];
  const activeTable = TABLES.find((table) => table.status === statusBucket)!;
  // Start reviewing always opens the highest-priority pending app (ungraded first).
  const startId = byStatus.pending[0]?.id ?? filtered[0]?.id ?? null;
  const trackCounts = {
    hacker: applications.filter((application) => application.type === "hacker").length,
    mentor: applications.filter((application) => application.type === "mentor").length,
  };
  const statusCounts = {
    pending: forTrack.filter((application) => application.status === "pending").length,
    accepted: forTrack.filter((application) => application.status === "accepted").length,
    rejected: forTrack.filter((application) => application.status === "rejected").length,
  };

  const selectedVisible = visible.filter((application) => selected.has(application.id));

  function switchTrack(next: Track) {
    setTrack(next);
    setSelected(new Set());
    setNotice(null);
  }

  function switchStatus(next: StatusBucket) {
    setStatusBucket(next);
    setSelected(new Set());
    setNotice(null);
  }

  function decide(decision: OrganizerDecision) {
    if (selectedVisible.length === 0) return;

    const labels: Record<OrganizerDecision, string> = {
      accepted: "Accept",
      rejected: "Reject",
      pending: "Mark not sure",
    };
    const emailNote =
      decision === "pending"
        ? "No email will be sent."
        : preview
          ? "Sends a real Resend email to TEST_DECISION_EMAIL."
          : "Status updates now. Email sends when Resend is configured.";

    if (
      !window.confirm(
        `${labels[decision]} ${selectedVisible.length} ${track} application${selectedVisible.length === 1 ? "" : "s"}? ${emailNote}`,
      )
    ) {
      return;
    }

    setNotice(null);
    if (preview) {
      if (decision === "pending") {
        setSelected(new Set());
        setNotice(`Preview: marked ${selectedVisible.length} as not sure. No email.`);
        return;
      }
      startTransition(async () => {
        try {
          const result = await sendPreviewDecisionEmails({
            decisions: selectedVisible.map((application) => ({
              firstName: application.first_name,
              type: application.type,
              decision,
            })),
          });
          setSelected(new Set());
          if (!result.ok) {
            setNotice(result.error);
            return;
          }
          setNotice(
            `Sent ${result.emailed} ${decision} email${result.emailed === 1 ? "" : "s"} to ${result.to}.`
            + (result.emailFailures ? ` ${result.emailFailures} failed.` : ""),
          );
        } catch (error) {
          setNotice(error instanceof Error ? error.message : "Could not send preview emails.");
        }
      });
      return;
    }

    startTransition(async () => {
      try {
        const result = await decideApplications({
          applicationIds: selectedVisible.map((application) => application.id),
          decision,
        });
        setSelected(new Set());
        setNotice(
          decision === "pending"
            ? `${result.decided} moved to Pending (not sure). No emails sent.`
            : result.emailSkipped
              ? `${result.decided} decision${result.decided === 1 ? "" : "s"} saved. Email skipped (RESEND_KEY not set).`
              : `${result.decided} decision${result.decided === 1 ? "" : "s"} saved; ${result.emailed} email${result.emailed === 1 ? "" : "s"} sent.`
                + (result.emailFailures
                  ? ` ${result.emailFailures} email${result.emailFailures === 1 ? " failed" : "s failed"}.`
                  : ""),
        );
      } catch (error) {
        setNotice(error instanceof Error ? error.message : "Could not save those decisions.");
      }
    });
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-primary/25 bg-[#201b38]/90 p-4 md:p-5">
        <div className="flex flex-wrap items-center justify-between gap-x-10 gap-y-3">
          {startId ? (
            <Link
              href={`${reviewBasePath}/${startId}`}
              className="rounded-full bg-star px-5 py-2.5 text-sm font-semibold text-[#201b38] transition hover:bg-[#ffe08a]"
            >
              Start reviewing {track}s →
            </Link>
          ) : (
            <span className="rounded-full border border-primary/25 px-4 py-2 text-sm text-white/40">
              No {track}s to review
            </span>
          )}

          <div className="ml-auto flex shrink-0 items-center gap-3">
            <div className="flex rounded-full border border-primary/30 p-1">
              {(["hacker", "mentor"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => switchTrack(type)}
                  className={`rounded-full px-5 py-2 text-sm font-medium capitalize transition ${
                    track === type
                      ? "bg-star text-[#201b38]"
                      : "text-primary hover:bg-primary/10"
                  }`}
                >
                  {type}s ({trackCounts[type]})
                </button>
              ))}
            </div>

            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="field !w-48 shrink-0 sm:!w-56"
              placeholder={`Search ${track}s…`}
              aria-label={`Search ${track} applications`}
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-primary/15 pt-4">
          <div className="flex w-full flex-wrap rounded-full border border-primary/30 p-1 sm:w-auto">
            {TABLES.map((table) => (
              <button
                key={table.status}
                type="button"
                onClick={() => switchStatus(table.status)}
                className={`rounded-full px-5 py-2 text-sm font-medium transition ${
                  statusBucket === table.status
                    ? table.activeClass
                    : "text-primary hover:bg-primary/10"
                }`}
              >
                {table.title} ({statusCounts[table.status]})
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-primary/15 pt-4">
          <span className="text-sm text-white/55">{selectedVisible.length} selected</span>
          <button
            type="button"
            disabled={isPending || selectedVisible.length === 0}
            onClick={() => decide("accepted")}
            className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
          >
            Accept
          </button>
          <button
            type="button"
            disabled={isPending || selectedVisible.length === 0}
            onClick={() => decide("rejected")}
            className="rounded-full bg-rose-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
          >
            Reject
          </button>
          {notice ? <p role="status" className="text-sm text-white/80">{notice}</p> : null}
        </div>
      </section>

      <StatusTable
        title={activeTable.title}
        subtitle={activeTable.subtitle}
        status={activeTable.status}
        applications={visible}
        reviewBasePath={reviewBasePath}
        selected={selected}
        onToggle={(id) =>
          setSelected((current) => {
            const next = new Set(current);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
          })
        }
        onToggleAll={() =>
          setSelected((current) => {
            const next = new Set(current);
            const allSelected = visible.length > 0 && visible.every((row) => next.has(row.id));
            visible.forEach((row) => {
              if (allSelected) next.delete(row.id);
              else next.add(row.id);
            });
            return next;
          })
        }
      />
    </div>
  );
}

function StatusTable({
  title,
  subtitle,
  status,
  applications,
  reviewBasePath,
  selected,
  onToggle,
  onToggleAll,
}: {
  title: string;
  subtitle: string;
  status: OrganizerApplication["status"];
  applications: OrganizerApplication[];
  reviewBasePath: string;
  selected: Set<string>;
  onToggle: (id: string) => void;
  onToggleAll: () => void;
}) {
  const allSelected =
    applications.length > 0 && applications.every((application) => selected.has(application.id));
  const accent = {
    pending: "border-amber-400/35",
    accepted: "border-emerald-400/35",
    rejected: "border-rose-400/35",
  }[status];

  return (
    <section className={`overflow-hidden rounded-2xl border bg-[#201b38]/90 ${accent}`}>
      <div className="flex flex-wrap items-end justify-between gap-2 border-b border-primary/15 px-5 py-4">
        <div>
          <h2 className="text-lg font-semibold text-white">
            {title}{" "}
            <span className="text-white/45">({applications.length})</span>
          </h2>
          <p className="mt-1 text-sm text-white/50">{subtitle}</p>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead className="border-b border-primary/15 text-primary/70">
            <tr>
              <th className="px-4 py-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={onToggleAll}
                  disabled={applications.length === 0}
                  aria-label={`Select all in ${title}`}
                />
              </th>
              <th className="px-4 py-3">Applicant</th>
              <th className="px-4 py-3">Score</th>
              <th className="px-4 py-3">Submitted</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-primary/10">
            {applications.map((application) => (
              <tr
                key={application.id}
                className={selected.has(application.id) ? "bg-primary/10" : "hover:bg-white/[0.03]"}
              >
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selected.has(application.id)}
                    onChange={() => onToggle(application.id)}
                    aria-label={`Select ${application.first_name} ${application.last_name}`}
                  />
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`${reviewBasePath}/${application.id}`}
                    className="font-medium text-white hover:text-star"
                  >
                    {application.first_name} {application.last_name}
                  </Link>
                  <span className="mt-1 block text-white/55">
                    {application.school_or_organization || "-"}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono tabular-nums text-white/80">
                  {application.average_score != null ? application.average_score.toFixed(1) : "-"}
                  <span className="mt-1 block text-xs text-white/45">
                    {application.grader_count
                      ? `${application.grader_count} rating${application.grader_count === 1 ? "" : "s"}`
                      : "unscored"}
                  </span>
                </td>
                <td className="px-4 py-3 text-white/70">
                  {new Date(application.submitted_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  {application.notification_error ? (
                    <span className="text-rose-200">Failed</span>
                  ) : application.notification_sent_at ? (
                    <span className="text-emerald-200">Sent</span>
                  ) : (
                    <span className="text-white/50">Not sent</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`${reviewBasePath}/${application.id}`}
                    className="text-sm font-medium text-star hover:underline"
                  >
                    Review
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {applications.length === 0 ? (
        <p className="p-8 text-center text-white/45">No {title.toLowerCase()} applications in this track.</p>
      ) : null}
    </section>
  );
}
