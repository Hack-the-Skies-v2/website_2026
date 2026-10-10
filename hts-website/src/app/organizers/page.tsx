import Link from "next/link";
import OrganizerSections from "@/components/OrganizerSections";
import type { OrganizerApplication } from "@/components/OrganizerDashboard";
import type { ScheduleEvent } from "@/components/ScheduleManager";
import { listOrganizerApplications } from "@/lib/applications/review";
import { listCheckedIn } from "@/lib/participants/checked-in";
import type { CheckedInPerson } from "@/lib/participants/checked-in";
import { requireOrganizer } from "@/lib/auth";
import { ensureApplicationQrCodeLinks } from "@/lib/qr-code";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getOrganizerPrizeImageUrl } from "@/actions/organizerPrizes";
import type { OrganizerPrize } from "@/components/PrizeManager";

export const dynamic = "force-dynamic";

export default async function OrganizersPage() {
    const organizer = await requireOrganizer();

    let applications: Awaited<ReturnType<typeof listOrganizerApplications>> = [];
    let loadError: string | null = null;
    let scheduleEvents: ScheduleEvent[] = [];
    let scheduleError: string | null = null;
    let checkedIn: CheckedInPerson[] = [];
    let checkedInError: string | null = null;
    let prizes: OrganizerPrize[] = [];
    let prizesError: string | null = null;
    try {
        await ensureApplicationQrCodeLinks();
    } catch (error) {
        loadError = error instanceof Error
            ? `Could not prepare application QR codes: ${error.message}`
            : "Could not prepare application QR codes.";
    }
    try {
        applications = await listOrganizerApplications(organizer.id);
    } catch (error) {
        loadError = error instanceof Error
            ? `Could not load applications: ${error.message}`
            : "Could not load applications.";
    }
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from("schedule_events")
            .select("id, title, description, type, start_time, end_time, location")
            .order("start_time");
        if (error) throw error;
        scheduleEvents = (data ?? []) as ScheduleEvent[];
    } catch (error) {
        scheduleError = error instanceof Error ? error.message : "Could not load schedule events.";
    }
    try {
        checkedIn = await listCheckedIn();
    } catch (error) {
        checkedInError = error instanceof Error ? error.message : "Could not load checked-in people.";
    }
    try {
        const admin = createAdminClient();
        const { data, error } = await admin
            .from("point_prizes")
            .select("id, name, description, points_required, quantity, max_redemptions, active, image_path")
            .order("points_required")
            .order("name");
        if (error) throw error;
        prizes = await Promise.all((data ?? []).map(async (prize) => ({
            ...prize,
            image_url: await getOrganizerPrizeImageUrl(prize.image_path),
        })));
    } catch (error) {
        prizesError = error instanceof Error ? error.message : "Could not load prizes.";
    }
    return (
        <main className="min-h-screen bg-white px-6 py-10 font-sans text-neutral-900 md:px-12">
            <div className="mx-auto max-w-7xl">
                <header className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200 pb-6">
                    <div>
                        <p className="text-xs uppercase tracking-wider text-neutral-500">
                            Hack the Skies · Organizer
                        </p>
                        <h1 className="mt-1 text-2xl font-semibold text-neutral-900">Organizer console</h1>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Link
                            href="/"
                            className="rounded-md border border-neutral-300 bg-white px-3.5 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900"
                        >
                            Public website
                        </Link>
                    </div>
                </header>
                <OrganizerSections
                    applications={applications as OrganizerApplication[]}
                    scheduleEvents={scheduleEvents}
                    scheduleError={scheduleError}
                    loadError={loadError}
                    checkedIn={checkedIn}
                    checkedInError={checkedInError}
                    prizes={prizes}
                    prizesError={prizesError}
                />
            </div>
        </main>
    );
}
