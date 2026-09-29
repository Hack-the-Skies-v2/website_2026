"use client";

import { useState, useTransition } from "react";
import { sendTestDecisionEmail } from "@/actions/sendTestDecisionEmail";

export default function EmailTestForm() {
  const [to, setTo] = useState("");
  const [firstName, setFirstName] = useState("Ali");
  const [type, setType] = useState<"hacker" | "mentor" | "judge">("hacker");
  const [decision, setDecision] = useState<"accepted" | "rejected">("accepted");
  const [notice, setNotice] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function send() {
    setNotice(null);
    startTransition(async () => {
      const result = await sendTestDecisionEmail({ to, firstName, type, decision });
      if (!result.ok) {
        setNotice(result.error);
        return;
      }
      setNotice(
        result.id
          ? `Sent ${decision} ${type} email to ${to}. Resend id: ${result.id}`
          : `Sent ${decision} ${type} email to ${to}.`,
      );
    });
  }

  return (
    <div className="space-y-5 rounded-lg border border-neutral-200 bg-transparent p-6">
      <div>
        <label className="mb-1.5 block text-xs uppercase tracking-wider text-neutral-500" htmlFor="test-to">
          Send to
        </label>
        <input
          id="test-to"
          type="email"
          value={to}
          onChange={(event) => setTo(event.target.value)}
          className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 outline-none focus:border-neutral-400"
          placeholder="you@example.com"
          autoComplete="email"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-xs uppercase tracking-wider text-neutral-500" htmlFor="test-name">
          First name in email
        </label>
        <input
          id="test-name"
          value={firstName}
          onChange={(event) => setFirstName(event.target.value)}
          className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 outline-none focus:border-neutral-400"
          placeholder="Ali"
        />
      </div>

      <div>
        <p className="mb-1.5 text-xs uppercase tracking-wider text-neutral-500">Track</p>
        <div className="flex gap-2">
          {(["hacker", "mentor", "judge"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setType(option)}
              className={`rounded px-3.5 py-1.5 text-sm capitalize transition ${
                type === option
                  ? "bg-neutral-900 font-medium text-white"
                  : "border border-neutral-200 bg-white text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-xs uppercase tracking-wider text-neutral-500">Decision</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setDecision("accepted")}
            className={`rounded px-3.5 py-1.5 text-sm transition ${
              decision === "accepted"
                ? "bg-neutral-900 font-medium text-white"
                : "border border-neutral-200 bg-white text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50"
            }`}
          >
            Acceptance
          </button>
          <button
            type="button"
            onClick={() => setDecision("rejected")}
            className={`rounded px-3.5 py-1.5 text-sm transition ${
              decision === "rejected"
                ? "bg-neutral-900 font-medium text-white"
                : "border border-neutral-200 bg-white text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50"
            }`}
          >
            Rejection
          </button>
        </div>
      </div>

      <button
        type="button"
        disabled={isPending || !to.trim()}
        onClick={send}
        className="w-full rounded-md bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:opacity-40"
      >
        {isPending ? "Sending…" : `Send ${decision} ${type} test email`}
      </button>

      {notice ? (
        <p role="status" className="text-sm text-neutral-700">
          {notice}
        </p>
      ) : null}
    </div>
  );
}
