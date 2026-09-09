import React from "react";
import { Score, Team, Track, User } from "../types";
import { Header } from "../components/Common";

type Props = {
  scores: Score[];
  teams: Team[];
  tracks: Track[];
  users: User[];
};

export default function JudgingSection({
  scores,
  teams,
  tracks,
  users,
}: Props) {
  const person = (id: string) => users.find((user) => user.id === id);
  const team = (id: string | null) => teams.find((item) => item.id === id);
  const track = (id: string) => tracks.find((item) => item.id === id);

  return (
    <>
      <Header
        label="Competition"
        title="Judging"
        description={`${scores.length} judged submissions across ${tracks.length} tracks.`}
      />
      <div className="mb-6 overflow-x-auto rounded-xl border border-slate-800 bg-slate-900">
        <table>
          <thead>
            <tr>
              <th>Judge</th>
              <th>Team</th>
              <th>Track</th>
              <th>Score</th>
              <th>Comments</th>
            </tr>
          </thead>
          <tbody>
            {scores.map((score) => (
              <tr key={score.id}>
                <td>{person(score.judgeId)?.name}</td>
                <td>{team(score.teamId)?.name}</td>
                <td>{track(score.trackId)?.name}</td>
                <td>
                  <strong>{score.score}/100</strong>
                </td>
                <td>{score.comments}</td>
              </tr>
            ))}
            {scores.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-sm text-slate-400">
                  No scores submitted yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold text-slate-900">Team-track completion</h3>
              <p className="mt-1 text-sm text-slate-500">
                Tracks are shown left to right in the same order for every team.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-slate-600">
              <span className="inline-flex items-center gap-1.5"><i className="size-3 rounded-sm bg-emerald-500" />Judged</span>
              <span className="inline-flex items-center gap-1.5"><i className="size-3 rounded-sm bg-amber-300" />Signed up, not judged</span>
              <span className="inline-flex items-center gap-1.5"><i className="size-3 rounded-sm bg-red-500" />Not signed up</span>
            </div>
          </div>
        </div>
        <div className="min-w-max p-3">
          <div className="flex items-stretch gap-2 px-3 pb-3">
            <div className="w-40 shrink-0 self-end text-xs font-semibold uppercase tracking-wide text-slate-500">Team</div>
            {tracks.map((trackItem, index) => (
              <div className="w-36 shrink-0 rounded-lg bg-slate-50 p-3" key={trackItem.id}>
                <span className="text-xs font-semibold text-slate-400">Track {index + 1}</span>
                <strong className="mt-1 block text-sm text-slate-900">{trackItem.name}</strong>
                <span className="mt-1 block text-xs leading-4 text-slate-500">{trackItem.description}</span>
              </div>
            ))}
          </div>
          {teams.map((teamItem) => (
            <div className="flex items-center gap-2 rounded-lg px-3 py-2 odd:bg-slate-50" key={teamItem.id}>
              <strong className="w-40 shrink-0 text-sm text-slate-900">{teamItem.name}</strong>
              {tracks.map((trackItem) => {
                const score = scores.find(
                  (item) =>
                    item.teamId === teamItem.id && item.trackId === trackItem.id,
                );
                const signedUp = teamItem.trackIds.includes(trackItem.id);
                return (
                  <span
                    className={`grid size-12 w-36 shrink-0 place-items-center rounded-lg text-sm font-semibold ${score ? "bg-emerald-500 text-white" : signedUp ? "bg-amber-300 text-amber-950" : "bg-red-500 text-white"}`}
                    key={trackItem.id}
                    title={score ? `${trackItem.name}: ${score.score}/100` : signedUp ? `${trackItem.name}: signed up, not judged` : `${trackItem.name}: not signed up`}
                  >
                    {score ? score.score : signedUp ? "Pending" : "N/A"}
                  </span>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
