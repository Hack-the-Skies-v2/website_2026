import React from "react";
import { Team, User } from "../types";
import { Header } from "../components/Common";

type Props = {
  users: User[];
  teams: Team[];
  checkedIn: number;
  query: string;
  setQuery: (q: string) => void;
  toggleCheckin: (id: string) => void;
};

export default function CheckInSection({
  users,
  teams,
  checkedIn,
  query,
  setQuery,
  toggleCheckin,
}: Props) {
  const team = (id: string | null) => teams.find((item) => item.id === id);

  const filtered = users.filter((user) =>
    `${user.name} ${user.email} ${user.qr}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );

  return (
    <>
      <Header
        label="Event day"
        title="Check-in desk"
        description="Lookup participants by name, email, or badge code to manage attendance."
      />
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="font-semibold text-white">Find a participant</h3>
          <span className="text-sm text-emerald-400">{checkedIn} checked in</span>
        </div>
        <input
          className="mb-3 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-amber-300"
          autoFocus
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Name, email, or QR code"
        />
        {filtered.map((user) => (
          <div className="flex items-center justify-between gap-3 border-t border-slate-800 py-3" key={user.id}>
            <span>
              <strong className="block text-sm text-white">{user.name}</strong>
              <small className="block text-xs text-slate-400">
                {user.role} · {team(user.teamId)?.name || "No team"}
              </small>
            </span>
            <button
              className={`rounded-lg px-3 py-2 text-xs font-semibold ${user.checkedIn ? "border border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200" : "bg-amber-300 text-slate-950 hover:bg-amber-200"}`}
              onClick={() => toggleCheckin(user.id)}
            >
              {user.checkedIn ? "Undo" : "Check in"}
            </button>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="py-4 text-sm text-slate-400">
            No matching participants found.
          </p>
        )}
      </div>
    </>
  );
}
