import React, { useState, type SubmitEvent } from "react";
import { Attendance, User } from "../types";
import { Header } from "../components/Common";

type Props = {
  kind: "meal" | "workshop";
  records: Attendance[];
  setRecords: React.Dispatch<React.SetStateAction<Attendance[]>>;
  users: User[];
  notify: (msg: string) => void;
};

export default function AttendanceSection({
  kind,
  records,
  setRecords,
  users,
  notify,
}: Props) {
  const [active, setActive] = useState(records[0]?.id ?? "");
  const [formOpen, setFormOpen] = useState(false);
  const [name, setName] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [query, setQuery] = useState("");

  const record = records.find((item) => item.id === active) || records[0];

  const save = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name) return;
    const item: Attendance = {
      id: `${kind[0]}${Date.now()}`,
      name,
      start,
      end,
      attendeeIds: [],
      ...(kind === "workshop"
        ? { description: "New workshop description", room: "TBD" }
        : {}),
    };
    setRecords((current) => [...current, item]);
    setActive(item.id);
    setName("");
    setStart("");
    setEnd("");
    setFormOpen(false);
    notify(`${kind === "meal" ? "Meal" : "Workshop"} created`);
  };

  const changeAttendance = (recordId: string, id: string) => {
    setRecords((current) =>
      current.map((rec) =>
        rec.id === recordId
          ? {
              ...rec,
              attendeeIds: rec.attendeeIds.includes(id)
                ? rec.attendeeIds.filter((item) => item !== id)
                : [...rec.attendeeIds, id],
            }
          : rec,
      ),
    );
    notify("Attendance updated");
  };

  return (
    <>
      <Header
        label="Event day"
        title={kind === "meal" ? "Meals" : "Workshops"}
        description={`Manage ${kind === "meal" ? "meal attendance separately from general check-in" : "sessions, rooms, and workshop attendance"}.`}
        action={
          <button
            className="rounded-lg bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-200"
            onClick={() => setFormOpen(!formOpen)}
          >
            New {kind}
          </button>
        }
      />
      {formOpen && (
          <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <form onSubmit={save}>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={kind === "meal" ? "Meal name" : "Workshop name"}
              required
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                value={start}
                onChange={(event) => setStart(event.target.value)}
                placeholder="Start time"
                required
              />
              <input
                value={end}
                onChange={(event) => setEnd(event.target.value)}
                placeholder="End time"
                required
              />
            </div>
            <button className="rounded-lg bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-200">Create</button>
          </form>
        </div>
      )}
      <div className="grid gap-6 xl:grid-cols-[minmax(15rem,0.35fr)_1fr]">
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          {records.map((item) => (
            <button
              className={`mb-1 w-full rounded-lg p-3 text-left ${item.id === active ? "bg-amber-300 text-slate-950" : "text-slate-700 hover:bg-slate-50"}`}
              key={item.id}
              onClick={() => setActive(item.id)}
            >
              <strong>{item.name}</strong>
              <small className="block text-xs text-slate-500">
                {item.start} - {item.end}
              </small>
              <small className="block text-xs text-slate-500">{item.attendeeIds.length} attended</small>
            </button>
          ))}
          {records.length === 0 && (
            <p className="p-4 text-sm text-slate-400">
              No {kind} records created yet.
            </p>
          )}
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          {record ? (
            <>
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-300">{kind} details</p>
                  <h3 className="mt-1 font-semibold text-slate-900">{record.name}</h3>
                </div>
                <button
                  className="text-sm text-rose-400 hover:text-rose-300"
                  onClick={() => {
                    setRecords((current) =>
                      current.filter((item) => item.id !== record.id),
                    );
                    setActive(
                      records.find((item) => item.id !== record.id)?.id ?? "",
                    );
                  }}
                >
                  Delete
                </button>
              </div>
              {kind === "workshop" && (
                <p className="mb-4 text-sm text-slate-400">
                  {record.description} · {record.room}
                </p>
              )}
              <div className="mb-4 grid grid-cols-2 gap-3 rounded-lg bg-slate-50 p-3 text-sm">
                  <span><strong className="mr-1 text-slate-900">{record.attendeeIds.length}</strong> attended</span>
                  <span><strong className="mr-1 text-slate-900">{users.length - record.attendeeIds.length}</strong> not attended</span>
              </div>
              <input
                className="mb-3 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-amber-300"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search participants"
              />
              {users
                .filter((user) =>
                  `${user.name} ${user.email}`
                    .toLowerCase()
                    .includes(query.toLowerCase()),
                )
                .map((user) => (
                  <div className="flex items-center justify-between gap-3 border-t border-slate-200 py-3" key={user.id}>
                    <span>
                      <strong className="block text-sm text-slate-900">{user.name}</strong>
                      <small className="block text-xs text-slate-500">{user.role}</small>
                    </span>
                    <button
                      className={`rounded-lg px-3 py-2 text-xs font-semibold ${record.attendeeIds.includes(user.id) ? "bg-slate-100 text-slate-600" : "border border-slate-300 text-slate-700 hover:bg-slate-50"}`}
                      onClick={() => changeAttendance(record.id, user.id)}
                    >
                      {record.attendeeIds.includes(user.id)
                        ? "Undo"
                        : "Check in"}
                    </button>
                  </div>
                ))}
            </>
          ) : (
            <div className="py-12 text-center text-sm text-slate-400">Create a record to begin.</div>
          )}
        </div>
      </div>
    </>
  );
}
