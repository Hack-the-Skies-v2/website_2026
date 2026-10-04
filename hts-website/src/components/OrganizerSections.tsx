"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import CheckedInList from "@/components/CheckedInList";
import OrganizerDashboard, { type OrganizerApplication } from "@/components/OrganizerDashboard";
import OrganizerQrScanner from "@/components/OrganizerQrScanner";
import ScheduleManager, { type ScheduleEvent } from "@/components/ScheduleManager";
import type { CheckedInPerson } from "@/lib/participants/checked-in";

export default function OrganizerSections({
    applications,
    scheduleEvents,
    scheduleError,
    loadError,
    checkedIn,
    checkedInError,
}: {
    applications: OrganizerApplication[];
    scheduleEvents: ScheduleEvent[];
    scheduleError: string | null;
    loadError: string | null;
    checkedIn: CheckedInPerson[];
    checkedInError: string | null;
}) {
    const router = useRouter();

    useEffect(() => {
        const refresh = () => router.refresh();
        const interval = window.setInterval(refresh, 5000);
        return () => window.clearInterval(interval);
    }, [router]);
    return (
        <div className="space-y-4">
            <details open className="rounded-lg border border-neutral-200">
                <summary className="cursor-pointer px-4 py-4 text-lg font-semibold text-neutral-900">QR scanner</summary>
                <div className="border-t border-neutral-200 p-4 md:p-5">
                    <OrganizerQrScanner events={scheduleEvents} onCheckedIn={() => router.refresh()} />
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