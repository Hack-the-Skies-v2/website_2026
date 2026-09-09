import React, { FormEvent, useState } from "react";
import { Attendance, CustomEvent, Section } from "../types";
import { Header, Stat } from "../components/Common";

type Props = {
  meals: Attendance[];
  workshops: Attendance[];
  customEvents: CustomEvent[];
  setCustomEvents: React.Dispatch<React.SetStateAction<CustomEvent[]>>;
  setSection: (section: Section) => void;
  notify: (message: string) => void;
};

type UnifiedEvent = {
  id: string;
  name: string;
  start: string;
  end: string;
  location: string;
  type: "Workshop" | "Meal" | "Custom";
  description?: string;
  attendeesCount?: number;
  isCustom: boolean;
};

export default function ScheduleSection({
  meals,
  workshops,
  customEvents,
  setCustomEvents,
  setSection,
  notify,
}: Props) {
  const [formOpen, setFormOpen] = useState(false);
  const [filterType, setFilterType] = useState<string>("All");
  const [query, setQuery] = useState("");

  // New event form state
  const [name, setName] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");

  const handleCreate = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newEvent: CustomEvent = {
      id: `ce${Date.now()}`,
      name: name.trim(),
      start: start.trim() || "TBD",
      end: end.trim() || "TBD",
      location: location.trim() || "Main Space",
      description: description.trim() || "",
    };

    setCustomEvents((prev) => [...prev, newEvent]);
    setName("");
    setStart("");
    setEnd("");
    setLocation("");
    setDescription("");
    setFormOpen(false);
    notify("Custom schedule event created");
  };

  const handleDeleteCustom = (id: string) => {
    setCustomEvents((prev) => prev.filter((item) => item.id !== id));
    notify("Event removed from schedule");
  };

  // Merge all events
  const allEvents: UnifiedEvent[] = [
    ...workshops.map((w) => ({
      id: w.id,
      name: w.name,
      start: w.start,
      end: w.end,
      location: w.room || "Workshop Room",
      type: "Workshop" as const,
      description: w.description,
      attendeesCount: w.attendeeIds.length,
      isCustom: false,
    })),
    ...meals.map((m) => ({
      id: m.id,
      name: m.name,
      start: m.start,
      end: m.end,
      location: "Dining Hall",
      type: "Meal" as const,
      description: "Catered meal for participants and staff",
      attendeesCount: m.attendeeIds.length,
      isCustom: false,
    })),
    ...customEvents.map((c) => ({
      id: c.id,
      name: c.name,
      start: c.start,
      end: c.end,
      location: c.location || "Venue",
      type: "Custom" as const,
      description: c.description,
      isCustom: true,
    })),
  ].sort((a, b) => a.start.localeCompare(b.start));

  const filtered = allEvents.filter((item) => {
    const matchesFilter =
      filterType === "All" || item.type.toLowerCase() === filterType.toLowerCase();
    const matchesQuery =
      item.name.toLowerCase().includes(query.toLowerCase()) ||
      item.location.toLowerCase().includes(query.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(query.toLowerCase()));
    return matchesFilter && matchesQuery;
  });

  return (
    <>
      <Header
        label="Event Timeline"
        title="Schedule"
        description="Unified view of all workshops, meals, and custom event activities."
        action={
          <button
            className="rounded-lg bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-200"
            onClick={() => setFormOpen((prev) => !prev)}
          >
            {formOpen ? "Close form" : "Add custom event"}
          </button>
        }
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Total activities" value={allEvents.length} />
        <Stat label="Workshops" value={workshops.length} />
        <Stat label="Meals" value={meals.length} />
        <Stat label="Custom events" value={customEvents.length} />
      </div>

      {formOpen && (
        <div className="mb-6 rounded-xl border border-slate-800 bg-slate-900 p-5">
          <h3>Add a custom event</h3>
          <p className="text-sm text-slate-400">
            Create ceremonies, hacking checkpoints, fun mini-events, or announcements.
          </p>
          <form onSubmit={handleCreate}>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Event name (e.g. Opening Ceremony)"
              required
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                value={start}
                onChange={(e) => setStart(e.target.value)}
                placeholder="Start time (e.g. 09:00)"
                required
              />
              <input
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                placeholder="End time (e.g. 10:00)"
                required
              />
            </div>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Location / room (e.g. Main Auditorium)"
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description or instructions for hackers"
            />
            <button className="rounded-lg bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-200">Save event</button>
          </form>
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search schedule by name, location, or description"
        />
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="All">All event types</option>
          <option value="Workshop">Workshops</option>
          <option value="Meal">Meals</option>
          <option value="Custom">Custom events</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900">
        <table>
          <thead>
            <tr>
              <th>Time</th>
              <th>Activity</th>
              <th>Type</th>
              <th>Location</th>
              <th>Details</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => (
              <tr key={item.id}>
                <td>
                  <strong>
                    {item.start} - {item.end}
                  </strong>
                </td>
                <td>
                  <strong>{item.name}</strong>
                </td>
                <td>{item.type}</td>
                <td>{item.location}</td>
                <td>
                  <small className="text-xs text-slate-400">
                    {item.description || "No description provided"}
                    {item.attendeesCount !== undefined &&
                      ` · ${item.attendeesCount} checked in`}
                  </small>
                </td>
                <td>
                  {item.isCustom ? (
                    <button
                      className="text-sm text-rose-400 hover:text-rose-300"
                      onClick={() => handleDeleteCustom(item.id)}
                    >
                      Delete
                    </button>
                  ) : item.type === "Workshop" ? (
                    <button
                      className="text-sm text-amber-300 hover:text-amber-200"
                      onClick={() => setSection("Workshops")}
                    >
                      View
                    </button>
                  ) : (
                    <button
                      className="text-sm text-amber-300 hover:text-amber-200"
                      onClick={() => setSection("Meals")}
                    >
                      View
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-sm text-slate-400">
                  No schedule activities found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
