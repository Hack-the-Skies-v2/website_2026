import React, { useState } from "react";
import { Score, Team, Track, User } from "../types";
import { Header } from "../components/Common";

type Props = {
  teams: Team[];
  setTeams: React.Dispatch<React.SetStateAction<Team[]>>;
  users: User[];
  tracks: Track[];
  scores: Score[];
  teamId: string | null;
  setTeamId: (id: string | null) => void;
};

export default function TeamsSection({
  teams,
  setTeams,
  users,
  tracks,
  scores,
  teamId,
  setTeamId,
}: Props) {
  const [query, setQuery] = useState("");

  const person = (id: string) => users.find((user) => user.id === id);
  const track = (id: string) => tracks.find((item) => item.id === id);
  const selected = teams.find((item) => item.id === teamId);

  return (
    <>
      <Header
        label="Groups"
        title="Teams"
        description={`${teams.length} teams formed for the event.`}
      />
      <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900">
          <div className="flex gap-3 p-4">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search teams"
            />
          </div>
          <table>
            <thead>
              <tr>
                <th>Team</th>
                <th>Members</th>
                <th>Tracks</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {teams
                .filter((item) =>
                  item.name.toLowerCase().includes(query.toLowerCase()),
                )
                .map((item) => (
                  <tr key={item.id}>
                    <td>
                      <button
                        className="font-medium text-amber-300"
                        onClick={() => setTeamId(item.id)}
                      >
                        <strong>{item.name}</strong>
                      </button>
                    </td>
                    <td>{item.memberIds.length}</td>
                    <td>
                      {item.trackIds
                        .map((id) => track(id)?.name)
                        .filter(Boolean)
                        .join(", ")}
                    </td>
                    <td>
                      <button
                        className="text-sm text-amber-300"
                        onClick={() => setTeamId(item.id)}
                      >
                        Open team
                      </button>
                    </td>
                  </tr>
                ))}
              {teams.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-sm text-slate-400">
                    No teams registered yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          {selected ? (
            <>
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-300">Team profile</p>
                  <h3>{selected.name}</h3>
                </div>
                <button
                  className="text-sm text-amber-300"
                  onClick={() => {
                    const name = window.prompt("Rename team", selected.name);
                    if (name && name.trim()) {
                      setTeams((current) =>
                        current.map((item) =>
                          item.id === selected.id ? { ...item, name: name.trim() } : item,
                        ),
                      );
                    }
                  }}
                >
                  Rename
                </button>
              </div>
              <h4>Members</h4>
              {selected.memberIds.map((id) => {
                const user = person(id);
                return (
                  user && (
                    <div className="flex items-center justify-between gap-3 border-t border-slate-800 py-3" key={id}>
                      <span>
                        <strong className="block text-sm text-white">{user.name}</strong>
                        <small className="block text-xs text-slate-400">
                          {user.role} ·{" "}
                          {user.checkedIn ? "Checked in" : "Not checked in"}
                        </small>
                      </span>
                      <button
                        className="text-sm text-amber-300"
                        onClick={() =>
                          setTeams((current) =>
                            current.map((item) =>
                              item.id === selected.id
                                ? {
                                    ...item,
                                    memberIds: item.memberIds.filter(
                                      (memberId) => memberId !== id,
                                    ),
                                  }
                                : item,
                            ),
                          )
                        }
                      >
                        Remove
                      </button>
                    </div>
                  )
                );
              })}
              <h4>Tracks</h4>
              <div>
                {selected.trackIds
                  .map((id) => track(id)?.name)
                  .filter(Boolean)
                  .join(", ") || "No tracks assigned"}
              </div>
              <h4>Judging</h4>
              {scores
                .filter((score) => score.teamId === selected.id)
                .map((score) => (
                  <div className="flex justify-between border-t border-slate-800 py-3 text-sm" key={score.id}>
                    <span>{track(score.trackId)?.name}</span>
                    <strong>{score.score}/100</strong>
                    <small>{score.comments}</small>
                  </div>
                ))}
              {scores.filter((score) => score.teamId === selected.id).length === 0 && (
                <p className="text-sm text-slate-400">No scores submitted for this team yet.</p>
              )}
            </>
          ) : (
            <div className="py-12 text-center text-sm text-slate-400">
              Select a team to view members and judging.
            </div>
          )}
        </div>
      </div>
    </>
  );
}
