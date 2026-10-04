"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { adjustParticipantPoints } from "@/actions/adjustParticipantPoints";

export default function ParticipantPointsForm({ userId }: { userId: string }) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(event: FormEvent) {
    event.preventDefault();
    setMessage(null);
    startTransition(async () => {
      const result = await adjustParticipantPoints({
        userId,
        amount: Number(amount),
        reason,
      });
      if (!result.ok) {
        setMessage(result.error);
        return;
      }
      setAmount("");
      setReason("");
      setMessage("Saved.");
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="mt-4 flex flex-wrap items-end gap-3">
      <label className="text-sm text-neutral-600">
        Amount
        <input
          required
          type="number"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          placeholder="+10 or -5"
          className="mt-1 block w-32 rounded-md border border-neutral-300 px-3 py-2 text-neutral-900 outline-none"
        />
      </label>
      <label className="min-w-56 flex-1 text-sm text-neutral-600">
        Reason
        <input
          required
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Why this change"
          className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-neutral-900 outline-none"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {pending ? "Saving" : "Update points"}
      </button>
      {message ? <p className="w-full text-sm text-neutral-600">{message}</p> : null}
    </form>
  );
}
