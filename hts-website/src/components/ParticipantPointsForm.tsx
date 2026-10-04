"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { adjustParticipantPoints } from "@/actions/adjustParticipantPoints";
import { awardParticipantPointAction } from "@/actions/awardParticipantPointAction";

export type PointActionOption = {
  id: string;
  name: string;
  description: string | null;
  points: number;
  max_redemptions: number | null;
};

export default function ParticipantPointsForm({
  userId,
  pointActions,
}: {
  userId: string;
  pointActions: PointActionOption[];
}) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [pointActionId, setPointActionId] = useState(pointActions[0]?.id ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [isAdjusting, startAdjustTransition] = useTransition();
  const [isAwarding, startAwardTransition] = useTransition();

  function submit(event: FormEvent) {
    event.preventDefault();
    setMessage(null);
    startAdjustTransition(async () => {
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

  function awardAction(event: FormEvent) {
    event.preventDefault();
    setMessage(null);
    startAwardTransition(async () => {
      const result = await awardParticipantPointAction({ userId, pointActionId });
      if (!result.ok) {
        setMessage(result.error);
        return;
      }
      setMessage("Point action awarded.");
      router.refresh();
    });
  }

  return (
    <div className="mt-4 space-y-4">
      <form onSubmit={awardAction} className="flex flex-wrap items-end gap-3 rounded-md border border-neutral-200 bg-neutral-50 p-3">
        <label className="min-w-64 flex-1 text-sm text-neutral-600">
          Award point action
          <select
            required
            value={pointActionId}
            onChange={(event) => setPointActionId(event.target.value)}
            className="mt-1 block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-neutral-900 outline-none"
          >
            <option value="" disabled>Select an action</option>
            {pointActions.map((action) => (
              <option key={action.id} value={action.id}>
                {action.name} (+{action.points} points)
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          disabled={isAwarding || isAdjusting || !pointActionId}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {isAwarding ? "Saving" : "Award action"}
        </button>
      </form>
      <form onSubmit={submit} className="flex flex-wrap items-end gap-3">
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
        disabled={isAdjusting || isAwarding}
        className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {isAdjusting ? "Saving" : "Update points"}
      </button>
      {message ? <p className="w-full text-sm text-neutral-600">{message}</p> : null}
      </form>
    </div>
  );
}
