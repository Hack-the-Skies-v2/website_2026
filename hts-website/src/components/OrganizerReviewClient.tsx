"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { decideApplications, type OrganizerDecision } from "@/actions/organizerDecisions";
import type { Question } from "@/lib/grading/types";

export type ReviewInfoField = {
  label: string;
  value: string;
  href?: string;
};

export type ReviewApplication = {
  id: string;
  type: "hacker" | "mentor" | "judge";
  status: "pending" | "accepted" | "rejected";
  first_name: string;
  last_name: string;
  email: string;
  school_or_organization: string | null;
  details: unknown;
  answers: { question: Question; text: string }[];
  info: ReviewInfoField[];
  submitted_at: string;
};

export default function OrganizerReviewClient({
  application,
  questions,
  initialScores,
  graderCount,
  previousHref = null,
  nextHref = null,
  advanceHref = null,
  listHref = "/organizers",
  position = null,
  total = 0,
}: {
  application: ReviewApplication;
  questions: Question[];
  previousHref?: string | null;
  nextHref?: string | null;
  advanceHref?: string | null;
  listHref?: string;
  position?: number | null;
  total?: number;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState<OrganizerDecision | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [tab, setTab] = useState<"questions" | "details">("questions");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setConfirming(null);
    setNotice(null);
    setTab("questions");
  }, [application.id]);

  function goAfterDecision() {
    router.push(advanceHref ?? listHref);
  }

  function decide(decision: OrganizerDecision) {
    setNotice(null);
    startTransition(async () => {
      try {
        await decideApplications({
          applicationIds: [application.id],
          decision,
        });
        setConfirming(null);
        goAfterDecision();
      } catch (error) {
        setNotice(error instanceof Error ? error.message : "Could not save decision.");
      }
    });
  }

  const confirmCopy: Record<OrganizerDecision, string> = {
    accepted: `Accept this ${application.type}?`,
    rejected: `Reject this ${application.type}?`,
    pending: "Mark as not sure and keep in Pending? No email will be sent.",
  };

  const statusColor = {
    pending: "text-neutral-600",
    accepted: "text-neutral-900 font-medium",
    rejected: "text-neutral-600",
  }[application.status];

  const navClass =
    "rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors";

  return (
    <div className="space-y-6">
      <nav className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-neutral-200 bg-transparent px-4 py-2.5">
        <div className="flex items-center gap-1">
          {previousHref ? (
            <Link href={previousHref} className={`${navClass} text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900`}>
              ← Previous
            </Link>
          ) : (
            <span className={`${navClass} text-neutral-300`}>← Previous</span>
          )}
          <span className="px-2 font-mono text-xs tabular-nums text-neutral-500">
            {position != null ? `${position} / ${total}` : `- / ${total}`}
          </span>
          {nextHref ? (
            <Link href={nextHref} className={`${navClass} text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900`}>
              Next →
            </Link>
          ) : (
            <span className={`${navClass} text-neutral-300`}>Next →</span>
          )}
        </div>
        <Link href={listHref} className={`${navClass} text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900`}>
          Back to list
        </Link>
      </nav>

      <section className="flex flex-wrap items-start justify-between gap-4 rounded-lg border border-neutral-200 bg-transparent p-5">
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-wider text-neutral-500">
            {application.type} application
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-neutral-900">
            {application.first_name} {application.last_name}
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            {application.school_or_organization || "No school listed"} · {application.email}
          </p>
          <p className={`mt-3 text-sm capitalize ${statusColor}`}>
            {application.status}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {confirming ? (
              <>
                <span className="text-sm text-neutral-700">{confirmCopy[confirming]}</span>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => decide(confirming)}
                  className="rounded-md bg-neutral-900 px-3.5 py-1.5 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-40"
                >
                  {isPending ? "Saving…" : "Confirm"}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirming(null)}
                  className="text-sm text-neutral-500 hover:text-neutral-900"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setConfirming("accepted")}
                  className="rounded-md border border-neutral-300 bg-white px-3.5 py-1.5 text-sm font-medium text-neutral-800 hover:bg-neutral-50"
                >
                  Accept
                </button>
                <button
                  type="button"
                  onClick={() => setConfirming("rejected")}
                  className="rounded-md border border-neutral-300 bg-white px-3.5 py-1.5 text-sm font-medium text-neutral-800 hover:bg-neutral-50"
                >
                  Reject
                </button>
                <button
                  type="button"
                  onClick={() => setConfirming("pending")}
                  className="rounded-md border border-neutral-300 bg-white px-3.5 py-1.5 text-sm font-medium text-neutral-800 hover:bg-neutral-50"
                >
                  Not sure
                </button>
              </>
            )}
            {notice ? <p role="status" className="text-sm text-neutral-700">{notice}</p> : null}
          </div>
        </div>

      </section>

      <div className="flex rounded-md border border-neutral-200 bg-neutral-100 p-0.5 w-fit">
        {(
          [
            { id: "questions" as const, label: "Questions" },
            { id: "details" as const, label: "Details & restrictions" },
          ] as const
        ).map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`rounded px-4 py-1.5 text-sm transition ${
              tab === item.id
                ? "bg-white font-medium text-neutral-900 shadow-sm"
                : "text-neutral-600 hover:text-neutral-900"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "questions" ? (
      <div className="flex flex-col gap-5">
        {application.answers.map(({ question, text }, index) => (
          <article
            key={question.id}
            className="flex flex-col rounded-lg border border-neutral-200 bg-transparent p-5"
          >
            <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Q{index + 1}</p>
            <h3 className="mt-1 text-sm font-semibold text-neutral-900">{question.prompt}</h3>
            <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed text-neutral-700">
              {text || <span className="italic text-neutral-400">Not filled</span>}
            </p>
          </article>
        ))}
      </div>
      ) : (
        <section className="rounded-lg border border-neutral-200 bg-transparent p-5 md:p-6">
          <h2 className="text-lg font-semibold text-neutral-900">Application details</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Restrictions, multiple-choice answers, links, and other profile fields.
          </p>
          {application.info?.length ? (
            <dl className="mt-6 grid gap-4 sm:grid-cols-2">
              {application.info.map((field) => (
                <div
                  key={`${field.label}:${field.value.slice(0, 24)}`}
                  className="rounded-md border border-neutral-200 bg-transparent px-4 py-3"
                >
                  <dt className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                    {field.label}
                  </dt>
                  <dd className="mt-1 whitespace-pre-wrap break-words text-sm text-neutral-800">
                    {field.value === "Not filled" || field.value === "Not uploaded" ? (
                      <span className="italic text-neutral-400">{field.value}</span>
                    ) : field.label === "Resume" && field.href ? (
                      <a
                        href={field.href}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex rounded-md border border-neutral-300 bg-neutral-100 px-3.5 py-1.5 text-sm font-medium text-neutral-800 hover:bg-neutral-200"
                      >
                        Open resume
                      </a>
                    ) : field.href || /^https?:\/\//i.test(field.value) ? (
                      <a
                        href={field.href || field.value}
                        target="_blank"
                        rel="noreferrer"
                        className="text-neutral-700 underline underline-offset-2 hover:text-neutral-900 break-all"
                      >
                        {field.value}
                      </a>
                    ) : (
                      field.value
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="mt-6 text-sm italic text-neutral-400">
              No extra details on file for this application.
            </p>
          )}
        </section>
      )}
    </div>
  );
}
