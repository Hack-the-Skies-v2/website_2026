"use client";

import { useState, type SubmitEvent } from "react";

export default function JudgeForm() {
    const [teamId, setTeamId] = useState("");
    const [score, setScore] = useState("");
    const [comments, setComments] = useState("");
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSubmitted(true);
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="mt-10 max-w-3xl rounded-3xl border border-primary/20 bg-[#171329]/90 p-6 shadow-[0_0_45px_rgba(107,87,155,0.2)] backdrop-blur-xl sm:p-8"
        >
            <div className="grid gap-6 sm:grid-cols-[1fr_0.7fr]">
                <label className="block">
                    <span className="text-sm font-semibold text-primary">
                        Team ID
                    </span>
                    <span className="mt-1 block text-sm text-primary/50">
                        Use the ID shown on the team&apos;s project display.
                    </span>
                    <input
                        required
                        value={teamId}
                        onChange={(event) => {
                            setTeamId(event.target.value);
                            setSubmitted(false);
                        }}
                        placeholder="e.g. HTS-042"
                        className="mt-3 w-full rounded-xl border border-primary/25 bg-[#221c38] px-4 py-3 text-primary outline-none transition placeholder:text-primary/30 focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                </label>

                <label className="block">
                    <span className="text-sm font-semibold text-primary">
                        Total score
                    </span>
                    <span className="mt-1 block text-sm text-primary/50">
                        Choose a number from 0 to 100.
                    </span>
                    <div className="relative mt-3">
                        <input
                            required
                            type="number"
                            min="0"
                            max="100"
                            value={score}
                            onChange={(event) => {
                                setScore(event.target.value);
                                setSubmitted(false);
                            }}
                            placeholder="00"
                            className="w-full rounded-xl border border-primary/25 bg-[#221c38] px-4 py-3 pr-16 text-primary outline-none transition placeholder:text-primary/30 focus:border-primary focus:ring-2 focus:ring-primary/20"
                        />
                        <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm text-primary/45">
                            / 100
                        </span>
                    </div>
                </label>
            </div>

            <label className="mt-6 block">
                <span className="text-sm font-semibold text-primary">
                    Comments
                </span>
                <span className="mt-1 block text-sm text-primary/50">
                    What stood out? Give the team feedback they can use.
                </span>
                <textarea
                    required
                    rows={6}
                    value={comments}
                    onChange={(event) => {
                        setComments(event.target.value);
                        setSubmitted(false);
                    }}
                    placeholder="Share your notes on the project..."
                    className="mt-3 w-full resize-y rounded-xl border border-primary/25 bg-[#221c38] px-4 py-3 text-primary outline-none transition placeholder:text-primary/30 focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
            </label>

            <div className="mt-6 flex flex-col gap-4 border-t border-primary/15 pt-6 sm:flex-row sm:items-center sm:justify-between">
                <button
                    type="submit"
                    className="rounded-full bg-button px-7 py-3 font-semibold text-white shadow-[0_0_20px_rgba(130,104,180,0.4)] transition hover:bg-[#8268B4] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-[#171329]"
                >
                    Submit score
                </button>
            </div>

            {submitted && (
                <p
                    className="mt-5 rounded-xl border border-emerald-400/25 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200"
                    role="status"
                >
                    Score recorded for this session. Backend submission will be
                    connected later.
                </p>
            )}
        </form>
    );
}
