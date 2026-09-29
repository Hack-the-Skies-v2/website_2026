import Link from "next/link";
import OrganizerDashboard from "@/components/OrganizerDashboard";
import { getMockOrganizerApplications } from "@/lib/grading/mock-applications";

export default function OrganizerPreviewPage() {
  return (
    <main className="min-h-screen bg-white px-6 py-10 font-sans text-neutral-900 md:px-12">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-neutral-200 pb-6">
          <div>
            <p className="text-xs uppercase tracking-wider text-neutral-500">
              Hack the Skies · Mock Preview
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-neutral-900">Organizer console</h1>
            <p className="mt-1 text-sm text-neutral-500">
              Local mock preview with sample data.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/organizers"
              className="rounded-md bg-neutral-900 px-3.5 py-1.5 text-sm font-medium text-white hover:bg-neutral-800"
            >
              Live organizer console
            </Link>
            <Link
              href="/organizers/preview/email-test"
              className="rounded-md border border-neutral-300 bg-white px-3.5 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900"
            >
              Test emails
            </Link>
            <Link
              href="/"
              className="rounded-md border border-neutral-300 bg-white px-3.5 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900"
            >
              Public website
            </Link>
          </div>
        </header>
        <OrganizerDashboard
          applications={getMockOrganizerApplications()}
          reviewBasePath="/organizers/preview"
          preview
        />
      </div>
    </main>
  );
}
