"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { CheckedInPerson, ParticipantRole } from "@/lib/participants/checked-in";

const ROLES: { id: ParticipantRole; label: string }[] = [
  { id: "hacker", label: "Hackers" },
  { id: "mentor", label: "Mentors" },
  { id: "judge", label: "Judges" },
];

export default function CheckedInList({ people }: { people: CheckedInPerson[] }) {
  const [role, setRole] = useState<ParticipantRole>("hacker");
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return people.filter((person) => {
      if (!person.roles.includes(role)) return false;
      if (!needle) return true;
      return `${person.name} ${person.email}`.toLowerCase().includes(needle);
    });
  }, [people, query, role]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex rounded-md border border-neutral-300 p-0.5">
          {ROLES.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setRole(item.id)}
              className={`rounded px-3 py-1.5 text-sm ${
                role === item.id ? "bg-neutral-900 text-white" : "text-neutral-700 hover:bg-neutral-100"
              }`}
            >
              {item.label}
              <span className="ml-2 text-xs opacity-70">
                {people.filter((person) => person.roles.includes(item.id)).length}
              </span>
            </button>
          ))}
        </div>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search name or email"
          className="w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm outline-none sm:w-64"
        />
      </div>
      {visible.length === 0 ? (
        <p className="text-sm text-neutral-500">No checked-in {role}s.</p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead className="border-b border-neutral-200 text-neutral-500">
            <tr>
              <th className="py-2 font-medium">Name</th>
              <th className="py-2 font-medium">Email</th>
              <th className="py-2 font-medium">Points</th>
              <th className="py-2" />
            </tr>
          </thead>
          <tbody>
            {visible.map((person) => (
              <tr key={person.id} className="border-b border-neutral-100 last:border-0">
                <td className="py-2">{person.name}</td>
                <td className="py-2 text-neutral-600">{person.email || "No email"}</td>
                <td className="py-2">{person.points}</td>
                <td className="py-2 text-right">
                  <Link href={`/organizers/participants/${person.id}`} className="font-medium underline">
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
