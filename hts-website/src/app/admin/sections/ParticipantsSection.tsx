import React, { useState } from "react";
import { Team, Transaction, User } from "../types";
import { Detail, Header } from "../components/Common";

type Props = {
  users: User[];
  teams: Team[];
  transactions: Transaction[];
  userId: string | null;
  setUserId: (id: string | null) => void;
  toggleCheckin: (id: string) => void;
};

export default function ParticipantsSection({
  users,
  teams,
  transactions,
  userId,
  setUserId,
  toggleCheckin,
}: Props) {
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("All roles");
  const [checkinFilter, setCheckinFilter] = useState("All check-in states");

  const team = (id: string | null) => teams.find((item) => item.id === id);

  const filtered = users.filter((user) => {
    const matchesQuery = `${user.name} ${user.email} ${user.role}`
      .toLowerCase()
      .includes(query.toLowerCase());
    const matchesRole =
      roleFilter === "All roles" || user.role === roleFilter;
    const matchesCheckin =
      checkinFilter === "All check-in states" ||
      (checkinFilter === "Checked in" && user.checkedIn) ||
      (checkinFilter === "Not checked in" && !user.checkedIn);
    return matchesQuery && matchesRole && matchesCheckin;
  });

  const selected = users.find((user) => user.id === userId);

  return (
    <>
      <Header
        label="People"
        title="Participants"
        description="One place to look up every person attending the event."
      />
      <div className="mb-4 flex flex-wrap gap-3">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search participants"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option>All roles</option>
          <option>Hacker</option>
          <option>Judge</option>
          <option>Mentor</option>
        </select>
        <select
          value={checkinFilter}
          onChange={(e) => setCheckinFilter(e.target.value)}
        >
          <option>All check-in states</option>
          <option>Checked in</option>
          <option>Not checked in</option>
        </select>
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900">
        <table>
          <thead>
            <tr>
              <th>Participant</th>
              <th>Email</th>
              <th>Role</th>
              <th>Team</th>
              <th>Check-in</th>
              <th>Points</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filtered.map((user) => (
              <tr key={user.id}>
                <td>
                  <button
                    className="font-medium text-amber-700 hover:text-amber-900"
                    onClick={() => setUserId(user.id)}
                  >
                    <span>
                      <strong>{user.name}</strong>
                    </span>
                  </button>
                </td>
                <td className="text-slate-500">{user.email}</td>
                <td>
                  {user.role}
                  {user.admin && <span> (Admin)</span>}
                </td>
                <td>{team(user.teamId)?.name || "Unassigned"}</td>
                <td>
                  <button
                    className={`rounded-md px-2 py-1 text-xs font-medium hover:bg-slate-100 ${user.checkedIn ? "text-emerald-600" : "text-red-600"}`}
                    onClick={() => toggleCheckin(user.id)}
                  >
                    {user.checkedIn ? "Checked in" : "Not checked in"}
                  </button>
                </td>
                <td>
                  <strong>{user.points}</strong>
                </td>
                <td>
                  <button className="text-sm text-amber-300 hover:text-amber-200" onClick={() => setUserId(user.id)}>
                    View
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-sm text-slate-400">
                  No participants found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {selected && (
        <div className="fixed inset-0 z-40 bg-slate-950/70 p-4" onClick={() => setUserId(null)}>
          <aside
            className="ml-auto h-full max-w-xl overflow-y-auto bg-slate-900 p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <button className="rounded-md px-2 py-1 text-2xl text-slate-400 hover:bg-slate-800 hover:text-white" onClick={() => setUserId(null)}>
              Close
            </button>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-300">Participant profile</p>
            <h2>{selected.name}</h2>
            <p className="text-sm text-slate-400">{selected.email}</p>
            <div className="my-4 rounded-lg bg-slate-800 p-3 text-sm">
              <span>{selected.checkedIn ? "Checked in" : "Not checked in"}</span>
              <strong>{selected.points} points</strong>
            </div>
            <div className="mt-4">
              <Detail label="Role" value={selected.role} />
              <Detail
                label="Team"
                value={team(selected.teamId)?.name || "Unassigned"}
              />
              <Detail label="QR code" value={selected.qr} />
              <Detail
                label="Attendance"
                value={
                  selected.checkedIn
                    ? "Event check-in complete"
                    : "Awaiting event check-in"
                }
              />
              <Detail
                label="Points history"
                value={`${transactions.filter((item) => item.userId === selected.id).length} transactions`}
              />
            </div>
            <button
              className="mt-4 w-full rounded-lg bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-200"
              onClick={() => toggleCheckin(selected.id)}
            >
              {selected.checkedIn ? "Undo check-in" : "Check in participant"}
            </button>
          </aside>
        </div>
      )}
    </>
  );
}
