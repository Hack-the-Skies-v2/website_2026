import Link from "next/link";
import CheckedInList from "@/components/CheckedInList";
import { requireOrganizer } from "@/lib/auth";
import { listCheckedIn } from "@/lib/participants/checked-in";

export const dynamic = "force-dynamic";

export default async function CheckedInPage() {
  await requireOrganizer();

  let people: Awaited<ReturnType<typeof listCheckedIn>> = [];
  let loadError: string | null = null;
  try {
    people = await listCheckedIn();
  } catch (error) {
    loadError = error instanceof Error ? error.message : "Could not load checked-in people.";
  }

  return (
    <main className="min-h-screen bg-white px-6 py-10 font-sans text-neutral-900 md:px-12">
      <div className="mx-auto max-w-5xl">
        <Link href="/organizers" className="text-sm underline">
          Organizer console
        </Link>
        <h1 className="mt-3 text-2xl font-semibold">Checked in</h1>
        <p className="mt-2 mb-8 text-neutral-600">People who have checked in, split by role.</p>
        {loadError ? <p className="text-sm text-neutral-600">{loadError}</p> : <CheckedInList people={people} />}
      </div>
    </main>
  );
}
