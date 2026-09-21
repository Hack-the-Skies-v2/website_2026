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
    <main className="min-h-screen px-5 py-10 font-outfit text-primary md:px-10">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-pixel text-sm uppercase tracking-[0.2em] text-star">
              Hack the Skies · private
            </p>
            <h1 className="mt-3 text-4xl font-semibold">Organizer console</h1>
            <p className="mt-2 text-white/65">
              Signed in as {organizer.email}. Live applications from the portal.
              Queue prioritizes apps you have not graded yet with the fewest ratings first.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/organizers/preview"
              className="rounded-full border border-primary/50 px-4 py-2 text-sm hover:bg-primary/10"
            >
              Mock preview
            </Link>
            <Link
              href="/"
              className="rounded-full border border-primary/50 px-4 py-2 text-sm hover:bg-primary/10"
            >
              Public website
            </Link>
          </div>
        </header>
        {loadError ? (
          <div className="rounded-2xl border border-red-400/40 bg-red-500/10 px-5 py-4 text-red-200">
            <p className="font-semibold">Organizer console could not load applications.</p>
            <p className="mt-2 text-sm text-red-100/80">{loadError}</p>
          </div>
        ) : (
          <OrganizerDashboard applications={applications} />
        )}
      </div>
    </main>
  );
}
