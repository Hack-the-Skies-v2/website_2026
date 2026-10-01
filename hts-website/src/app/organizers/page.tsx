import Link from "next/link";
import OrganizerDashboard from "@/components/OrganizerDashboard";
import { listOrganizerApplications } from "@/lib/applications/review";
import { requireOrganizer } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function OrganizersPage() {
    const organizer = await requireOrganizer();

    let applications: Awaited<ReturnType<typeof listOrganizerApplications>> = [];
    let loadError: string | null = null;
    try {
        applications = await listOrganizerApplications(organizer.id);
    } catch (error) {
        loadError = error instanceof Error ? error.message : "Could not load applications.";
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
                {loadError ? (
                    <div className="rounded-lg border border-neutral-300 bg-neutral-50 px-5 py-4 text-neutral-800">
                        <p className="font-semibold text-neutral-900">Organizer console could not load applications.</p>
                        <p className="mt-1 text-sm text-neutral-600">{loadError}</p>
                    </div>
                ) : (
                    <OrganizerDashboard applications={applications} />
                )}
            </div>
        </main>
    );
}
