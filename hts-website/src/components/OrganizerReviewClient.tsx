"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { clearOrganizerGrade, submitOrganizerGrade } from "@/actions/organizerGrades";
import { decideApplications } from "@/actions/organizerDecisions";
import {
  SCORE_MAX,
  SCORE_POSITIONS,
  compositeScore,
  positionToScore,
  scoreToPosition,
} from "@/lib/grading/scoring";
import type { Question } from "@/lib/grading/types";

const AUTOSAVE_DELAY_MS = 600;

type SaveState = "idle" | "saving" | "saved" | "error";
type Scores = Record<string, number | null>;

export type ReviewApplication = {
  id: string;
  type: "hacker" | "mentor";
  status: "pending" | "accepted" | "rejected";
  first_name: string;
  last_name: string;
  email: string;
  school_or_organization: string | null;
  details: unknown;
  answers: { question: Question; text: string }[];
  submitted_at: string;
};

export default function OrganizerReviewClient({
  application,
  questions,
  initialScores,
  graderCount,
}: {
  application: ReviewApplication;
  questions: Question[];
  initialScores: Record<string, number>;
  graderCount: number;
}) {
  const router = useRouter();
  const [scores, setScores] = useState<Scores>(() =>
    Object.fromEntries(questions.map((q) => [q.id, initialScores[q.id] ?? null])),
  );
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [confirming, setConfirming] = useState<"accepted" | "rejected" | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const pendingSave = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (pendingSave.current) clearTimeout(pendingSave.current);
    },
    [],
  );

  const composite = compositeScore(
    Object.fromEntries(
      Object.entries(scores).filter(([, value]) => value != null),
    ) as Record<string, number>,
    questions,
  );
  const scored = questions.filter((q) => scores[q.id] != null).length;
  const weightTotal = questions.reduce((sum, q) => sum + q.weight, 0);
  const gradedNow = composite !== null;
  const liveCount =
    graderCount + (gradedNow && Object.keys(initialScores).length === 0 ? 1 : 0)
    - (!gradedNow && Object.keys(initialScores).length > 0 ? 1 : 0);

  function commit(next: Scores) {
    if (pendingSave.current) clearTimeout(pendingSave.current);
    const values = questions.map((q) => next[q.id]);
    const noneScored = values.every((v) => v == null);
    const allScored = values.every((v) => v != null);
    if (!allScored && !noneScored) {
      setSaveState("idle");
      return;
    }
    setSaveState("saving");
    pendingSave.current = setTimeout(async () => {
      try {
        if (noneScored) await clearOrganizerGrade(application.id);
        else {
          await submitOrganizerGrade({
            applicationId: application.id,
            scores: Object.fromEntries(
              questions.map((q) => [q.id, next[q.id] as number]),
            ),
          });
        }
        setSaveState("saved");
        router.refresh();
      } catch {
        setSaveState("error");
      }
    }, AUTOSAVE_DELAY_MS);
  }

  function setScore(questionId: string, score: number | null) {
    const next = { ...scores, [questionId]: score };
    setScores(next);
    commit(next);
  }

  function clearAll() {
    const next = Object.fromEntries(questions.map((q) => [q.id, null]));
    setScores(next);
    commit(next);
  }

  function decide(decision: "accepted" | "rejected") {
    setNotice(null);
    startTransition(async () => {
      try {
        const result = await decideApplications({
          applicationIds: [application.id],
          decision,
        });
        setConfirming(null);
        setNotice(
          `${decision === "accepted" ? "Accepted" : "Rejected"}; ${result.emailed} email${result.emailed === 1 ? "" : "s"} sent.`
          + (result.emailFailures ? ` ${result.emailFailures} email failed.` : ""),
        );
        router.refresh();
      } catch (error) {
        setNotice(error instanceof Error ? error.message : "Could not save decision.");
      }
    });
  }

  const statusColor = {
    pending: "text-amber-200",
    accepted: "text-emerald-300",
    rejected: "text-rose-300",
  }[application.status];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-primary/25 bg-[#201b38]/90 p-5">
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-[0.16em] text-primary/70">
            {application.type} application
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-white">
            {application.first_name} {application.last_name}
          </h1>
          <p className="mt-1 text-sm text-white/60">
            {application.school_or_organization || "No school listed"} · {application.email}
          </p>
          <p className={`mt-3 text-sm font-semibold capitalize ${statusColor}`}>
            {application.status}
            <span className="ml-3 font-normal text-white/50">
              Rated by {liveCount} organizer{liveCount === 1 ? "" : "s"}
            </span>
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {confirming ? (
              <>
                <span className="text-sm text-white/80">
                  {confirming === "accepted" ? "Accept" : "Reject"} and email this {application.type}?
                </span>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => decide(confirming)}
                  className="rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-[#201b38] disabled:opacity-40"
                >
                  {isPending ? "Sending…" : "Confirm"}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirming(null)}
                  className="text-sm text-white/60 hover:text-white"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setConfirming("accepted")}
                  className="rounded-full border border-emerald-400/50 px-4 py-1.5 text-sm font-medium text-emerald-200 hover:bg-emerald-500/15"
                >
                  Accept & email
                </button>
                <button
                  type="button"
                  onClick={() => setConfirming("rejected")}
                  className="rounded-full border border-rose-400/50 px-4 py-1.5 text-sm font-medium text-rose-200 hover:bg-rose-500/15"
                >
                  Reject & email
                </button>
              </>
            )}
            {notice ? <p role="status" className="text-sm text-white/75">{notice}</p> : null}
          </div>
        </div>

        <div className="flex w-36 flex-col items-end text-right">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-primary/60">
            {composite != null ? "Final score" : "Composite"}
          </span>
          <span className="font-mono text-4xl font-semibold tabular-nums text-star">
            {composite != null ? composite.toFixed(2) : "–"}
          </span>
          <span className="text-[11px] text-white/45">
            {composite != null ? `out of ${SCORE_MAX}` : `${scored} of ${questions.length} scored`}
          </span>
          <div className="mt-2 flex h-4 items-center gap-2">
            {saveState !== "idle" ? (
              <span className={`text-[11px] ${saveState === "error" ? "text-rose-300" : "text-white/45"}`}>
                {saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved" : "Not saved"}
              </span>
            ) : null}
            {scored > 0 && saveState !== "saving" ? (
              <button type="button" onClick={clearAll} className="text-[11px] text-white/50 underline-offset-2 hover:text-rose-300 hover:underline">
                Clear
              </button>
            ) : null}
          </div>
        </div>
      </header>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {application.answers.map(({ question, text }, index) => (
          <article
            key={question.id}
            className="flex min-h-[22rem] flex-col rounded-2xl border border-primary/25 bg-[#201b38]/90 p-5"
          >
            <p className="text-[11px] font-bold uppercase tracking-widest text-star">Q{index + 1}</p>
            <h3 className="mt-1 text-sm font-semibold text-white">{question.prompt}</h3>
            <p className="mt-3 flex-1 whitespace-pre-wrap text-sm leading-relaxed text-white/75">
              {text || <span className="italic text-white/35">No response.</span>}
            </p>
            <div className="mt-4 border-t border-primary/15 pt-3">
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-white/40">
                  {Math.round((question.weight / weightTotal) * 100)}% of composite
                </span>
                <span className="font-mono text-sm tabular-nums text-white">
                  {scores[question.id] == null ? (
                    <span className="text-white/30">–</span>
                  ) : (
                    scores[question.id]!.toFixed(1)
                  )}
                  <span className="text-white/40">/{SCORE_MAX}</span>
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={SCORE_POSITIONS}
                step={1}
                value={scoreToPosition(scores[question.id] ?? null)}
                onChange={(event) =>
                  setScore(question.id, positionToScore(Number(event.target.value)))
                }
                aria-label={`Question ${index + 1} score out of ${SCORE_MAX}`}
                className="mt-2 h-1.5 w-full cursor-pointer accent-[var(--star)]"
              />
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
