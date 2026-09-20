"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { decideApplications } from "@/actions/organizerDecisions";

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

type StatusFilter = "all" | OrganizerApplication["status"];
type TypeFilter = "all" | OrganizerApplication["type"];

export default function OrganizerDashboard({
  applications,
}: {
  applications: OrganizerApplication[];
}) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [notice, setNotice] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const visible = useMemo(
    () =>
      applications.filter((application) => {
        const haystack =
          `${application.first_name} ${application.last_name} ${application.email} ${application.school_or_organization ?? ""}`.toLowerCase();
        return (
          (statusFilter === "all" || application.status === statusFilter)
          && (typeFilter === "all" || application.type === typeFilter)
          && haystack.includes(query.toLowerCase())
        );
      }),
    [applications, statusFilter, typeFilter, query],
  );

  const selectedVisible = visible.filter((application) => selected.has(application.id));
  const allVisibleSelected =
    visible.length > 0 && visible.every((application) => selected.has(application.id));

  const statusCounts = Object.fromEntries(
    (["pending", "accepted", "rejected"] as const).map((status) => [
      status,
      applications.filter((application) => application.status === status).length,
    ]),
  );
  const typeCounts = {
    hacker: applications.filter((application) => application.type === "hacker").length,
    mentor: applications.filter((application) => application.type === "mentor").length,
  };

  function toggleAll() {
    setSelected((current) => {
      const next = new Set(current);
      visible.forEach((application) => {
        if (allVisibleSelected) next.delete(application.id);
        else next.add(application.id);
      });
      return next;
    });
  }

  function decide(decision: "accepted" | "rejected") {
    if (selectedVisible.length === 0) return;
    const label = decision === "accepted" ? "Accept" : "Reject";
    if (
      !window.confirm(
        `${label} ${selectedVisible.length} application${selectedVisible.length === 1 ? "" : "s"}? This immediately sends the decision email.`,
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
          `${result.decided} decision${result.decided === 1 ? "" : "s"} saved; ${result.emailed} email${result.emailed === 1 ? "" : "s"} sent.`
          + (result.emailFailures
            ? ` ${result.emailFailures} email${result.emailFailures === 1 ? " failed" : "s failed"}; retry after checking Resend.`
            : ""),
        );
      } catch (error) {
        setNotice(error instanceof Error ? error.message : "Could not save those decisions.");
      }
    });
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-3 sm:grid-cols-3">
        {(["pending", "accepted", "rejected"] as const).map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setStatusFilter(status)}
            className={`rounded-2xl border p-5 text-left transition ${
              statusFilter === status
                ? "border-star bg-[#2b2448]"
                : "border-primary/25 bg-[#201b38]/80 hover:border-primary/70"
            }`}
          >
            <span className="block text-sm uppercase tracking-[0.14em] text-primary/70">
              {status}
            </span>
            <strong className="mt-2 block text-3xl text-white">{statusCounts[status]}</strong>
          </button>
        ))}
      </section>

      <section className="rounded-2xl border border-primary/25 bg-[#201b38]/90 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="field max-w-sm"
            placeholder="Search name, email, school…"
            aria-label="Search applications"
          />
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={`rounded-full px-4 py-2 text-sm ${
              statusFilter === "all"
                ? "bg-primary text-[#201b38]"
                : "border border-primary/40 text-primary"
            }`}
          >
            All {applications.length}
          </button>
          {(["hacker", "mentor"] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setTypeFilter((current) => (current === type ? "all" : type))}
              className={`rounded-full px-4 py-2 text-sm capitalize ${
                typeFilter === type
                  ? "bg-star text-[#201b38]"
                  : "border border-primary/40 text-primary"
              }`}
            >
              {type}s {typeCounts[type]}
            </button>
          ))}
          <span className="ml-auto text-sm text-white/60">
            {selectedVisible.length} selected
          </span>
        </div>
        <div className="mt-4 flex flex-wrap gap-3 border-t border-primary/15 pt-4">
          <button
            type="button"
            disabled={isPending || selectedVisible.length === 0}
            onClick={() => decide("accepted")}
            className="rounded-full bg-emerald-600 px-5 py-2 font-medium text-white disabled:opacity-40"
          >
            {isPending ? "Sending…" : "Accept & email"}
          </button>
          <button
            type="button"
            disabled={isPending || selectedVisible.length === 0}
            onClick={() => decide("rejected")}
            className="rounded-full bg-rose-700 px-5 py-2 font-medium text-white disabled:opacity-40"
          >
            Reject & email
          </button>
          {notice ? <p role="status" className="self-center text-sm text-white/80">{notice}</p> : null}
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-primary/25 bg-[#201b38]/90">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead className="border-b border-primary/20 text-primary/70">
              <tr>
                <th className="px-4 py-4">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={toggleAll}
                    aria-label="Select all visible applications"
                  />
                </th>
                <th className="px-4 py-4">Applicant</th>
                <th className="px-4 py-4">Track</th>
                <th className="px-4 py-4">Score</th>
                <th className="px-4 py-4">Submitted</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-4 py-4">Email</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary/10">
              {visible.map((application) => (
                <ApplicationRow
                  key={application.id}
                  application={application}
                  selected={selected.has(application.id)}
                  onToggle={() =>
                    setSelected((current) => {
                      const next = new Set(current);
                      if (next.has(application.id)) next.delete(application.id);
                      else next.add(application.id);
                      return next;
                    })
                  }
                />
              ))}
            </tbody>
          </table>
        </div>
        {visible.length === 0 ? (
          <p className="p-10 text-center text-white/55">No applications match this view.</p>
        ) : null}
      </section>
    </div>
  );
}

function ApplicationRow({
  application,
  selected,
  onToggle,
}: {
  application: OrganizerApplication;
  selected: boolean;
  onToggle: () => void;
}) {
  const colors = {
    pending: "bg-amber-400/15 text-amber-200",
    accepted: "bg-emerald-400/15 text-emerald-200",
    rejected: "bg-rose-400/15 text-rose-200",
  };

  return (
    <tr className={selected ? "bg-primary/10" : "hover:bg-white/[0.03]"}>
      <td className="px-4 py-4">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggle}
          aria-label={`Select ${application.first_name} ${application.last_name}`}
        />
      </td>
      <td className="px-4 py-4">
        <Link
          href={`/organizers/review/${application.id}`}
          className="font-medium text-white hover:text-star"
        >
          {application.first_name} {application.last_name}
        </Link>
        <span className="mt-1 block text-white/55">
          {application.school_or_organization || "—"}
        </span>
      </td>
      <td className="px-4 py-4 capitalize text-white/80">{application.type}</td>
      <td className="px-4 py-4 font-mono tabular-nums text-white/80">
        {application.average_score != null ? application.average_score.toFixed(1) : "—"}
        <span className="mt-1 block text-xs text-white/45">
          {application.grader_count
            ? `${application.grader_count} rating${application.grader_count === 1 ? "" : "s"}`
            : "unscored"}
          {application.my_score != null ? ` · yours ${application.my_score.toFixed(1)}` : ""}
        </span>
      </td>
      <td className="px-4 py-4 text-white/70">
        {new Date(application.submitted_at).toLocaleDateString()}
      </td>
      <td className="px-4 py-4">
        <span className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${colors[application.status]}`}>
          {application.status}
        </span>
      </td>
      <td className="px-4 py-4">
        {application.notification_error ? (
          <span className="text-rose-200">Failed</span>
        ) : application.notification_sent_at ? (
          <span className="text-emerald-200">Sent</span>
        ) : (
          <span className="text-white/50">Not sent</span>
        )}
      </td>
    </tr>
  );
}
