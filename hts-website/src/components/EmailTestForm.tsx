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
    <div className="mx-auto max-w-lg space-y-5 rounded-2xl border border-primary/25 bg-[#201b38]/90 p-6">
      <div>
        <label className="mb-1.5 block text-sm text-primary/80" htmlFor="test-to">
          Send to
        </label>
        <input
          id="test-to"
          type="email"
          value={to}
          onChange={(event) => setTo(event.target.value)}
          className="field"
          placeholder="you@example.com"
          autoComplete="email"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm text-primary/80" htmlFor="test-name">
          First name in email
        </label>
        <input
          id="test-name"
          value={firstName}
          onChange={(event) => setFirstName(event.target.value)}
          className="field"
          placeholder="Ali"
        />
      </div>

      <div>
        <p className="mb-1.5 text-sm text-primary/80">Track</p>
        <div className="flex gap-2">
          {(["hacker", "mentor", "judge"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setType(option)}
              className={`rounded-full px-4 py-2 text-sm capitalize ${
                type === option
                  ? "bg-star text-[#201b38]"
                  : "border border-primary/40 text-primary"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-sm text-primary/80">Decision</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setDecision("accepted")}
            className={`rounded-full px-4 py-2 text-sm ${
              decision === "accepted"
                ? "bg-emerald-600 text-white"
                : "border border-emerald-400/40 text-emerald-200"
            }`}
          >
            Acceptance
          </button>
          <button
            type="button"
            onClick={() => setDecision("rejected")}
            className={`rounded-full px-4 py-2 text-sm ${
              decision === "rejected"
                ? "bg-rose-700 text-white"
                : "border border-rose-400/40 text-rose-200"
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
        className="w-full rounded-full bg-primary px-5 py-3 font-semibold text-[#201b38] disabled:opacity-40"
      >
        {isPending ? "Sending…" : `Send ${decision} ${type} test email`}
      </button>

      {notice ? (
        <p role="status" className="text-sm text-white/80">
          {notice}
        </p>
      ) : null}
    </div>
  );
}
