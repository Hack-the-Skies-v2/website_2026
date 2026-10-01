"use client";

import OrganizerDashboard, { type OrganizerApplication } from "@/components/OrganizerDashboard";
import OrganizerQrScanner from "@/components/OrganizerQrScanner";
import ScheduleManager, { type ScheduleEvent } from "@/components/ScheduleManager";

export default function OrganizerSections({
    applications,
    scheduleEvents,
    scheduleError,
    loadError,
}: {
    applications: OrganizerApplication[];
    scheduleEvents: ScheduleEvent[];
    scheduleError: string | null;
    loadError: string | null;
}) {
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
                <summary className="cursor-pointer px-4 py-4 text-lg font-semibold text-neutral-900">Schedule</summary>
                <div className="border-t border-neutral-200 p-4 md:p-5">
                    {scheduleError ? <p className="text-sm text-neutral-600">{scheduleError}</p> : <ScheduleManager initialEvents={scheduleEvents} />}
                </div>
            </details>
        </div>
    );
}