"use client";

import { useEffect } from "react";

export default function OrganizerError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("Organizer panel error:", error);
    }, [error]);

    return (
        <main className="min-h-screen bg-white px-6 py-10 font-sans text-neutral-900 md:px-12">
            <div className="mx-auto max-w-3xl rounded-lg border border-red-200 bg-red-50 p-6">
                <h1 className="text-xl font-semibold text-red-900">Organizer panel error</h1>
                <p className="mt-3 whitespace-pre-wrap text-sm text-red-800">
                    {error.message}
                </p>
                {error.digest ? (
                    <p className="mt-3 text-xs text-red-700">Digest: {error.digest}</p>
                ) : null}
                <button
                    type="button"
                    onClick={() => reset()}
                    className="mt-5 rounded-md bg-red-900 px-4 py-2 text-sm font-medium text-white hover:bg-red-800"
                >
                    Try again
                </button>
            </div>
        </main>
    );
}
