import Link from "next/link";
import { notFound } from "next/navigation";
import ParticipantPointsForm from "@/components/ParticipantPointsForm";
import { requireOrganizer } from "@/lib/auth";
import { getCheckedInDetail } from "@/lib/participants/checked-in";

export const dynamic = "force-dynamic";

export default async function CheckedInPersonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireOrganizer();
  const { id } = await params;
  const person = await getCheckedInDetail(id);
  if (!person) notFound();

  return (
    <main className="min-h-screen bg-white px-6 py-10 font-sans text-neutral-900 md:px-12">
      <div className="mx-auto max-w-3xl">
        <Link href="/organizers" className="text-sm underline">
          Organizer console
        </Link>
        <h1 className="mt-3 text-2xl font-semibold">{person.name}</h1>
        <p className="mt-2 text-neutral-600">
          {person.email || "No email"} · {person.roles.join(", ") || "no role"}
        </p>

        <section className="mt-8 rounded-lg border border-neutral-200 p-5">
          <h2 className="text-lg font-semibold">Points</h2>
          <p className="mt-1 text-3xl font-semibold">{person.points}</p>
          <ParticipantPointsForm userId={person.id} />
          {person.pointsLog.length === 0 ? (
            <p className="mt-4 text-sm text-neutral-500">No point history.</p>
          ) : (
            <ul className="mt-5 divide-y divide-neutral-100">
              {person.pointsLog.map((entry) => (
                <li key={entry.id} className="flex items-baseline justify-between gap-4 py-3 text-sm">
                  <span>
                    {entry.reason}
                    <span className="ml-2 text-neutral-400">{new Date(entry.at).toLocaleString()}</span>
                  </span>
                  <span>{entry.amount > 0 ? `+${entry.amount}` : entry.amount}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-5 rounded-lg border border-neutral-200 p-5">
          <h2 className="text-lg font-semibold">Events attended</h2>
          {person.events.length === 0 ? (
            <p className="mt-3 text-sm text-neutral-500">None yet.</p>
          ) : (
            <ul className="mt-3 divide-y divide-neutral-100">
              {person.events.map((event) => (
                <li key={event.id} className="flex items-baseline justify-between gap-4 py-3 text-sm">
                  <span>
                    {event.name}
                    <span className="ml-2 text-neutral-400">{event.kind}</span>
                  </span>
                  <span className="text-neutral-500">{new Date(event.at).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
