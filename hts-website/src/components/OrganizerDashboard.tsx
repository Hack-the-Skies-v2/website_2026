"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { decideApplications, type OrganizerDecision } from "@/actions/organizerDecisions";
import { prioritizeForReview } from "@/lib/grading/queue";

export type OrganizerApplication = {
  id: string;
  type: "hacker" | "mentor" | "judge";
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
    activeClass: "bg-white font-medium text-neutral-900 shadow-sm",
  },
  {
    status: "accepted",
    title: "Accepted",
    subtitle: "Accepted applicants",
    activeClass: "bg-white font-medium text-neutral-900 shadow-sm",
  },
  {
    status: "rejected",
    title: "Rejected",
    subtitle: "Rejected applicants",
    activeClass: "bg-white font-medium text-neutral-900 shadow-sm",
  },
];

export default function OrganizerDashboard({
  applications,
  reviewBasePath = "/organizers/review",
}: {
  applications: OrganizerApplication[];
  reviewBasePath?: string;
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
  const startId = byStatus.pending[0]?.id ?? filtered[0]?.id ?? null;
  const trackCounts = {
    hacker: applications.filter((application) => application.type === "hacker").length,
    mentor: applications.filter((application) => application.type === "mentor").length,
    judge: applications.filter((application) => application.type === "judge").length,
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
        : "Status updates now. Email sends when Resend is configured.";

    if (
      !window.confirm(
        `${labels[decision]} ${selectedVisible.length} ${track} application${selectedVisible.length === 1 ? "" : "s"}? ${emailNote}`,
      )
    ) {
      return;
    }

    setNotice(null);
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
      <section className="rounded-lg border border-neutral-200 bg-transparent p-4 md:p-5">
        <div className="flex flex-wrap items-center justify-between gap-x-10 gap-y-3">
          {startId ? (
            <Link
              href={`${reviewBasePath}/${startId}`}
              className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-800"
            >
              Start reviewing {track}s
            </Link>
          ) : (
            <span className="rounded-md border border-neutral-200 px-4 py-2 text-sm text-neutral-400">
              No {track}s to review
            </span>
          )}

          <div className="ml-auto flex shrink-0 items-center gap-3">
            <div className="flex rounded-md border border-neutral-200 bg-neutral-100 p-0.5">
              {(["hacker", "mentor", "judge"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => switchTrack(type)}
                  className={`rounded px-3.5 py-1.5 text-sm capitalize transition ${
                    track === type
                      ? "bg-white font-medium text-neutral-900 shadow-sm"
                      : "text-neutral-600 hover:text-neutral-900"
                  }`}
                >
                  {type}s ({trackCounts[type]})
                </button>
              ))}
            </div>

            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="w-48 shrink-0 rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-sm text-neutral-900 placeholder-neutral-400 outline-none focus:border-neutral-400 sm:w-56"
              placeholder={`Search ${track}s…`}
              aria-label={`Search ${track} applications`}
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-neutral-200 pt-4">
          <div className="flex w-full flex-wrap rounded-md border border-neutral-200 bg-neutral-100 p-0.5 sm:w-auto">
            {TABLES.map((table) => (
              <button
                key={table.status}
                type="button"
                onClick={() => switchStatus(table.status)}
                className={`rounded px-3.5 py-1.5 text-sm transition ${
                  statusBucket === table.status
                    ? table.activeClass
                    : "text-neutral-600 hover:text-neutral-900"
                }`}
              >
                {table.title} ({statusCounts[table.status]})
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-neutral-200 pt-4">
          <span className="text-sm text-neutral-500">{selectedVisible.length} selected</span>
          <button
            type="button"
            disabled={isPending || selectedVisible.length === 0}
            onClick={() => decide("accepted")}
            className="rounded-md border border-neutral-300 bg-white px-3.5 py-1.5 text-sm font-medium text-neutral-800 hover:bg-neutral-50 disabled:opacity-30"
          >
            Accept
          </button>
          <button
            type="button"
            disabled={isPending || selectedVisible.length === 0}
            onClick={() => decide("rejected")}
            className="rounded-md border border-neutral-300 bg-white px-3.5 py-1.5 text-sm font-medium text-neutral-800 hover:bg-neutral-50 disabled:opacity-30"
          >
            Reject
          </button>
          {notice ? <p role="status" className="text-sm text-neutral-700">{notice}</p> : null}
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

  return (
    <section className="overflow-hidden rounded-lg border border-neutral-200 bg-transparent">
      <div className="flex flex-wrap items-end justify-between gap-2 border-b border-neutral-200 px-5 py-4">
        <div>
          <h2 className="text-base font-semibold text-neutral-900">
            {title}{" "}
            <span className="text-neutral-400">({applications.length})</span>
          </h2>
          <p className="mt-1 text-xs text-neutral-500">{subtitle}</p>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead className="border-b border-neutral-200 text-xs uppercase tracking-wider text-neutral-500">
            <tr>
              <th className="px-4 py-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={onToggleAll}
                  disabled={applications.length === 0}
                  aria-label={`Select all in ${title}`}
                  className="rounded border-neutral-300 accent-neutral-900"
                />
              </th>
              <th className="px-4 py-3">Applicant</th>
              <th className="px-4 py-3">Score</th>
              <th className="px-4 py-3">Submitted</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {applications.map((application) => (
              <tr
                key={application.id}
                className={selected.has(application.id) ? "bg-neutral-50" : "hover:bg-neutral-50/60"}
              >
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selected.has(application.id)}
                    onChange={() => onToggle(application.id)}
                    aria-label={`Select ${application.first_name} ${application.last_name}`}
                    className="rounded border-neutral-300 accent-neutral-900"
                  />
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`${reviewBasePath}/${application.id}`}
                    className="font-medium text-neutral-900 hover:underline"
                  >
                    {application.first_name} {application.last_name}
                  </Link>
                  <span className="mt-0.5 block text-xs text-neutral-500">
                    {application.school_or_organization || "-"}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono tabular-nums text-neutral-800">
                  {application.average_score != null ? application.average_score.toFixed(1) : "-"}
                  <span className="mt-0.5 block text-xs text-neutral-400">
                    {application.grader_count
                      ? `${application.grader_count} rating${application.grader_count === 1 ? "" : "s"}`
                      : "unscored"}
                  </span>
                </td>
                <td className="px-4 py-3 text-neutral-600">
                  {new Date(application.submitted_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-xs">
                  {application.notification_error ? (
                    <span className="text-neutral-500">Failed</span>
                  ) : application.notification_sent_at ? (
                    <span className="text-neutral-800">Sent</span>
                  ) : (
                    <span className="text-neutral-400">Not sent</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`${reviewBasePath}/${application.id}`}
                    className="text-sm font-medium text-neutral-700 hover:text-neutral-900 hover:underline"
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
        <p className="p-8 text-center text-neutral-400">No {title.toLowerCase()} applications in this track.</p>
      ) : null}
    </section>
  );
}
