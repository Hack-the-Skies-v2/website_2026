import React, { useState, type SubmitEvent } from "react";
import { Score, Team, Track } from "../types";
import { Header } from "../components/Common";

type Props = {
  tracks: Track[];
  setTracks: React.Dispatch<React.SetStateAction<Track[]>>;
  teams: Team[];
  scores: Score[];
  notify: (msg: string) => void;
};

export default function TracksSection({
  tracks,
  setTracks,
  teams,
  scores,
  notify,
}: Props) {
  const [editing, setEditing] = useState<Track | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const save = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim()) return;
    setTracks((current) =>
      editing
        ? current.map((item) =>
            item.id === editing.id ? { ...item, name, description } : item,
          )
        : [
            ...current,
            { id: `tr${Date.now()}`, name, description, color: "#d8c8ff" },
          ],
    );
    setEditing(null);
    setName("");
    setDescription("");
    notify("Track saved");
  };

  return (
    <>
      <Header
        label="Competition"
        title="Tracks"
        description="Manage themes with many-to-many team participation."
        action={
          <button
            className="rounded-lg bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950"
            onClick={() => {
              setEditing(null);
              setName("");
              setDescription("");
            }}
          >
            New track
          </button>
        }
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {tracks.map((item) => (
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5" key={item.id}>
            <h3>{item.name}</h3>
            <p>{item.description}</p>
            <small>
              {
                teams.filter((teamItem) =>
                  teamItem.trackIds.includes(item.id),
                ).length
              }{" "}
              teams ·{" "}
              {scores.filter((score) => score.trackId === item.id).length}{" "}
              scores
            </small>
            <div className="mt-4 flex gap-3">
              <button
                className="text-sm text-amber-300"
                onClick={() => {
                  setEditing(item);
                  setName(item.name);
                  setDescription(item.description);
                }}
              >
                Edit
              </button>
              <button
                className="text-sm text-rose-400"
                onClick={() =>
                  setTracks((current) =>
                    current.filter((trackItem) => trackItem.id !== item.id),
                  )
                }
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
        <h3>{editing ? "Edit track" : "Create a track"}</h3>
        <form onSubmit={save}>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Track name"
            required
          />
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Track description"
            required
          />
          <button className="rounded-lg bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950">
            {editing ? "Save changes" : "Create track"}
          </button>
        </form>
      </div>
    </>
  );
}
