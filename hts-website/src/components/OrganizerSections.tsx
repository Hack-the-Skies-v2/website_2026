"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import CheckedInList from "@/components/CheckedInList";
import OrganizerDashboard, { type OrganizerApplication } from "@/components/OrganizerDashboard";
import OrganizerQrScanner from "@/components/OrganizerQrScanner";
import ScheduleManager, { type ScheduleEvent } from "@/components/ScheduleManager";
import type { CheckedInPerson, HackerSearchResult } from "@/lib/participants/checked-in";

export default function OrganizerSections({
    applications,
    scheduleEvents,
    scheduleError,
    loadError,
    checkedIn,
    checkedInError,
    hackers,
    hackersError,
}: {
    applications: OrganizerApplication[];
    scheduleEvents: ScheduleEvent[];
    scheduleError: string | null;
    loadError: string | null;
    checkedIn: CheckedInPerson[];
    checkedInError: string | null;
    hackers: HackerSearchResult[];
    hackersError: string | null;
}) {
    const [hackerQuery, setHackerQuery] = useState("");
    const hackerMatches = useMemo(() => {
        const needle = hackerQuery.trim().toLowerCase();
        if (!needle) return [];
        return hackers
            .filter((hacker) => `${hacker.name} ${hacker.email}`.toLowerCase().includes(needle))
            .slice(0, 8);
    }, [hackerQuery, hackers]);
    return (
        <div className="space-y-4">
            <details open className="rounded-lg border border-neutral-200">
                <summary className="cursor-pointer px-4 py-4 text-lg font-semibold text-neutral-900">QR scanner</summary>
                <div className="border-t border-neutral-200 p-4 md:p-5">
                    <OrganizerQrScanner events={scheduleEvents} />
                </div>
            </details>
            <details open className="rounded-lg border border-neutral-200">
                <summary className="cursor-pointer px-4 py-4 text-lg font-semibold text-neutral-900">Application review</summary>
                <div className="border-t border-neutral-200 p-4 md:p-5">
                    {loadError ? <p className="text-sm text-neutral-600">{loadError}</p> : <OrganizerDashboard applications={applications} />}
                </div>
            </details>
            <details open className="rounded-lg border border-neutral-200">
                <summary className="cursor-pointer px-4 py-4 text-lg font-semibold text-neutral-900">Checked in</summary>
                <div className="border-t border-neutral-200 p-4 md:p-5">
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-neutral-700" htmlFor="hacker-search">
                            Search hackers
                        </label>
                        <input
                            id="hacker-search"
                            value={hackerQuery}
                            onChange={(event) => setHackerQuery(event.target.value)}
                            placeholder="Name or email"
                            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm outline-none sm:w-80"
                        />
                        {hackersError ? <p className="mt-2 text-sm text-neutral-600">{hackersError}</p> : null}
                        {hackerQuery.trim() && !hackersError ? (
                            hackerMatches.length === 0 ? (
                                <p className="mt-2 text-sm text-neutral-500">No hackers match.</p>
                            ) : (
                                <ul className="mt-2 divide-y divide-neutral-100 rounded-md border border-neutral-200">
                                    {hackerMatches.map((hacker) => (
                                        <li key={hacker.id}>
                                            <Link
                                                href={`/organizers/participants/${hacker.id}`}
                                                className="flex items-baseline justify-between gap-4 px-3 py-2 text-sm hover:bg-neutral-50"
                                            >
                                                <span>
                                                    {hacker.name}
                                                    <span className="ml-2 text-neutral-500">{hacker.email || "No email"}</span>
                                                </span>
                                                <span className="text-neutral-500">
                                                    {hacker.points} pts{hacker.checkedIn ? " · checked in" : ""}
                                                </span>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            )
                        ) : null}
                    </div>
                    {checkedInError ? <p className="text-sm text-neutral-600">{checkedInError}</p> : <CheckedInList people={checkedIn} />}
                </div>
            </details>
            <details open className="rounded-lg border border-neutral-200">
                <summary className="cursor-pointer px-4 py-4 text-lg font-semibold text-neutral-900">Schedule</summary>
                <div className="border-t border-neutral-200 p-4 md:p-5">
                    {scheduleError ? <p className="text-sm text-neutral-600">{scheduleError}</p> : <ScheduleManager initialEvents={scheduleEvents} />}
                </div>
            </details>
        </div>
    );
}