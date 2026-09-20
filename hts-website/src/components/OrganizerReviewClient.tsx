"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { clearOrganizerGrade, submitOrganizerGrade } from "@/actions/organizerGrades";
import { decideApplications, type OrganizerDecision } from "@/actions/organizerDecisions";
import { sendPreviewDecisionEmails } from "@/actions/sendPreviewDecisionEmails";
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
  type: "hacker" | "mentor" | "judge";
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
  preview = false,
  previousHref = null,
  nextHref = null,
  advanceHref = null,
  listHref = "/organizers",
  position = null,
  total = 0,
}: {
  application: ReviewApplication;
  questions: Question[];
  initialScores: Record<string, number>;
  graderCount: number;
  preview?: boolean;
  previousHref?: string | null;
  nextHref?: string | null;
  /** After Accept / Reject / Not sure, go here (usually the next app). */
  advanceHref?: string | null;
  listHref?: string;
  position?: number | null;
  total?: number;
}) {
  const router = useRouter();
  const [scores, setScores] = useState<Scores>(() =>
    Object.fromEntries(questions.map((q) => [q.id, initialScores[q.id] ?? null])),
  );
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [confirming, setConfirming] = useState<OrganizerDecision | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const pendingSave = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (pendingSave.current) clearTimeout(pendingSave.current);
    },
    [],
  );

  useEffect(() => {
    setScores(
      Object.fromEntries(questions.map((q) => [q.id, initialScores[q.id] ?? null])),
    );
    setSaveState("idle");
    setConfirming(null);
    setNotice(null);
  }, [application.id]); // eslint-disable-line react-hooks/exhaustive-deps -- reset only when the applicant changes

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

  function goAfterDecision() {
    router.push(advanceHref ?? listHref);
  }

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
        if (preview) {
          setSaveState("saved");
          return;
        }
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

  function decide(decision: OrganizerDecision) {
    setNotice(null);
    if (preview) {
      if (decision === "pending") {
        setConfirming(null);
        setNotice("Preview: marked not sure. Opening next…");
        window.setTimeout(goAfterDecision, 350);
        return;
      }
      startTransition(async () => {
        try {
          const result = await sendPreviewDecisionEmails({
            decisions: [
              {
                firstName: application.first_name,
                type: application.type,
                decision,
              },
            ],
          });
          setConfirming(null);
          if (!result.ok) {
            setNotice(result.error);
            return;
          }
          setNotice(`Sent ${decision} email to ${result.to}. Opening next…`);
          window.setTimeout(goAfterDecision, 600);
        } catch (error) {
          setNotice(error instanceof Error ? error.message : "Could not send preview email.");
        }
      });
      return;
    }
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
    pending: "text-amber-200",
    accepted: "text-emerald-300",
    rejected: "text-rose-300",
  }[application.status];

  const navClass =
    "rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors";

  return (
    <div className="space-y-6">
      <nav className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/25 bg-[#201b38]/90 px-4 py-2.5">
        <div className="flex items-center gap-1">
          {previousHref ? (
            <Link href={previousHref} className={`${navClass} text-primary hover:bg-primary/10`}>
              ← Previous
            </Link>
          ) : (
            <span className={`${navClass} text-white/25`}>← Previous</span>
          )}
          <span className="px-2 font-mono text-xs tabular-nums text-white/45">
            {position != null ? `${position} / ${total}` : `- / ${total}`}
          </span>
          {nextHref ? (
            <Link href={nextHref} className={`${navClass} text-primary hover:bg-primary/10`}>
              Next →
            </Link>
          ) : (
            <span className={`${navClass} text-white/25`}>Next →</span>
          )}
        </div>
        <Link href={listHref} className={`${navClass} text-white/55 hover:bg-primary/10 hover:text-white`}>
          Back to list
        </Link>
      </nav>

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
                <span className="text-sm text-white/80">{confirmCopy[confirming]}</span>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => decide(confirming)}
                  className="rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-[#201b38] disabled:opacity-40"
                >
                  {isPending ? "Saving…" : "Confirm"}
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
                  Accept
                </button>
                <button
                  type="button"
                  onClick={() => setConfirming("rejected")}
                  className="rounded-full border border-rose-400/50 px-4 py-1.5 text-sm font-medium text-rose-200 hover:bg-rose-500/15"
                >
                  Reject
                </button>
                <button
                  type="button"
                  onClick={() => setConfirming("pending")}
                  className="rounded-full border border-amber-400/50 px-4 py-1.5 text-sm font-medium text-amber-200 hover:bg-amber-500/15"
                >
                  Not sure
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
            {composite != null ? composite.toFixed(2) : "-"}
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
                    <span className="text-white/30">-</span>
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
