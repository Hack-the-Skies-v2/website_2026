import Link from "next/link";
import OrganizerDashboard from "@/components/OrganizerDashboard";
import { getMockOrganizerApplications } from "@/lib/grading/mock-applications";

export default function OrganizerPreviewPage() {
  return (
    <main className="min-h-screen px-5 py-10 font-outfit text-primary md:px-10">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-pixel text-sm uppercase tracking-[0.2em] text-star">
              Hack the Skies · mock preview
            </p>
            <h1 className="mt-3 text-4xl font-semibold">Organizer console</h1>
            <p className="mt-2 text-white/65">
              Local mock: Accept and Reject send real emails to TEST_DECISION_EMAIL. Pick any application and try it.
            </p>
          </div>
          <Link
            href="/organizers/preview/email-test"
            className="rounded-full border border-primary/50 px-4 py-2 text-sm hover:bg-primary/10"
          >
            Test emails
          </Link>
          <Link
            href="/"
            className="rounded-full border border-primary/50 px-4 py-2 text-sm hover:bg-primary/10"
          >
            Public website
          </Link>
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
