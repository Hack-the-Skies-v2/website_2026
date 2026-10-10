"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
    createScheduleEvent,
    deleteScheduleEvent,
    updateScheduleEvent,
} from "@/actions/scheduleEvents";

const eventTypes = ["workshop", "event", "meal", "ceremony", "check_in", "activity", "other"] as const;

export type ScheduleEvent = {
    id: string;
    title: string;
    type: (typeof eventTypes)[number];
    description: string | null;
    start_time: string;
    end_time: string;
    location: string | null;
};

type EventForm = {
    title: string;
    type: ScheduleEvent["type"];
    description: string;
    startTime: string;
    endTime: string;
    location: string;
};

const emptyForm: EventForm = {
    title: "",
    type: "event",
    description: "",
    startTime: "",
    endTime: "",
    location: "",
};

function dateTimeValue(value: string) {
    const date = new Date(value);
    const pad = (part: number) => String(part).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function displayDate(value: string) {
    return new Date(value).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}

function formFromEvent(event: ScheduleEvent): EventForm {
    return {
        title: event.title,
        type: event.type,
        description: event.description ?? "",
        startTime: dateTimeValue(event.start_time),
        endTime: dateTimeValue(event.end_time),
        location: event.location ?? "",
    };
}

export default function ScheduleManager({ initialEvents }: { initialEvents: ScheduleEvent[] }) {
    const router = useRouter();
    const [events, setEvents] = useState(initialEvents);
    const [form, setForm] = useState<EventForm>(emptyForm);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [notice, setNotice] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    useEffect(() => {
        setEvents(initialEvents);
    }, [initialEvents]);

    function openCreate() {
        setEditingId(null);
        setForm(emptyForm);
        setError(null);
        setNotice(null);
        setIsOpen(true);
    }

    function openEdit(event: ScheduleEvent) {
        setEditingId(event.id);
        setForm(formFromEvent(event));
        setError(null);
        setNotice(null);
        setIsOpen(true);
    }

    function submit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError(null);
        setNotice(null);
        if (!form.title.trim() || !form.startTime || !form.endTime) {
            setError("Title, start time, and end time are required.");
            return;
        }
        if (new Date(form.endTime) <= new Date(form.startTime)) {
            setError("End time must be after start time.");
            return;
        }

        startTransition(async () => {
            try {
                const values = {
                    ...form,
                    startTime: new Date(form.startTime).toISOString(),
                    endTime: new Date(form.endTime).toISOString(),
                };
                if (editingId) {
                    const result = await updateScheduleEvent({ ...values, id: editingId });
                    if (!result.success) {
                        setError(result.error);
                        return;
                    }
                    setNotice("Event updated.");
                } else {
                    const result = await createScheduleEvent(values);
                    if (!result.success) {
                        setError(result.error);
                        return;
                    }
                    setNotice("Event added.");
                }
                setIsOpen(false);
                router.refresh();
            } catch (caught) {
                setError(caught instanceof Error ? caught.message : "Could not save event.");
            }
        });
    }

    function remove(event: ScheduleEvent) {
        if (!window.confirm(`Delete "${event.title}"? This cannot be undone.`)) return;
        setError(null);
        setNotice(null);
        startTransition(async () => {
            try {
                const result = await deleteScheduleEvent(event.id);
                if (!result.success) {
                    setError(result.error);
                    return;
                }
                setEvents((current) => current.filter((item) => item.id !== event.id));
                setNotice("Event deleted.");
                router.refresh();
            } catch (caught) {
                setError(caught instanceof Error ? caught.message : "Could not delete event.");
            }
        });
    }

    function updateField(field: keyof EventForm, value: string) {
        setForm((current) => ({ ...current, [field]: value }));
    }

    function updateDateTimeField(field: "startTime" | "endTime", value: string) {
        if (value.split("-")[0]?.length > 4) return;
        updateField(field, value);
    }

    return (
        <section className="mt-8 border-t border-neutral-200 pt-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="text-xl font-semibold text-neutral-900">Schedule</h2>
                </div>
                <button type="button" onClick={openCreate} className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800">
                    Add Event
                </button>
            </div>

            {notice ? <p role="status" className="mt-4 text-sm text-neutral-700">{notice}</p> : null}
            {error ? <p role="alert" className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p> : null}

            {isOpen ? (
                <form onSubmit={submit} className="mt-5 rounded-lg border border-neutral-200 bg-neutral-50 p-4 md:p-5">
                    <div className="mb-4 flex items-center justify-between gap-3">
                        <h3 className="font-semibold text-neutral-900">{editingId ? "Edit event" : "Add event"}</h3>
                        <button type="button" onClick={() => setIsOpen(false)} className="text-sm text-neutral-500 hover:text-neutral-900">Cancel</button>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                        <label className="text-sm font-medium text-neutral-700">Title<input value={form.title} onChange={(event) => updateField("title", event.target.value)} className="mt-1 block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 font-normal text-neutral-900 outline-none focus:border-neutral-500" required /></label>
                        <label className="text-sm font-medium text-neutral-700">Type<select value={form.type} onChange={(event) => updateField("type", event.target.value)} className="mt-1 block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 font-normal text-neutral-900 outline-none focus:border-neutral-500">{eventTypes.map((type) => <option key={type} value={type}>{type.replace("_", " ")}</option>)}</select></label>
                        <label className="text-sm font-medium text-neutral-700">Start time<input type="datetime-local" value={form.startTime} onChange={(event) => updateDateTimeField("startTime", event.target.value)} min="0001-01-01T00:00" max="9999-12-31T23:59" className="mt-1 block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 font-normal text-neutral-900 outline-none focus:border-neutral-500" required /></label>
                        <label className="text-sm font-medium text-neutral-700">End time<input type="datetime-local" value={form.endTime} onChange={(event) => updateDateTimeField("endTime", event.target.value)} min="0001-01-01T00:00" max="9999-12-31T23:59" className="mt-1 block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 font-normal text-neutral-900 outline-none focus:border-neutral-500" required /></label>
                        <label className="text-sm font-medium text-neutral-700 md:col-span-2">Location<input value={form.location} onChange={(event) => updateField("location", event.target.value)} className="mt-1 block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 font-normal text-neutral-900 outline-none focus:border-neutral-500" /></label>
                        <label className="text-sm font-medium text-neutral-700 md:col-span-2">Description<textarea value={form.description} onChange={(event) => updateField("description", event.target.value)} rows={3} className="mt-1 block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 font-normal text-neutral-900 outline-none focus:border-neutral-500" /></label>
                    </div>
                    <button type="submit" disabled={isPending} className="mt-4 rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50">{isPending ? "Saving..." : editingId ? "Save changes" : "Create event"}</button>
                </form>
            ) : null}

            {events.length === 0 ? (
                <div className="mt-5 rounded-lg border border-dashed border-neutral-300 px-5 py-8 text-center text-sm text-neutral-500">No schedule events yet.</div>
            ) : (
                <div className="mt-5 overflow-hidden rounded-lg border border-neutral-200">
                    <div className="divide-y divide-neutral-200">
                        {events.map((event) => (
                            <article key={event.id} className="p-4 md:p-5">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h3 className="font-semibold text-neutral-900">{event.title}</h3>
                                            <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs capitalize text-neutral-600">{event.type.replace("_", " ")}</span>
                                        </div>
                                        <p className="mt-1 text-sm text-neutral-600">{displayDate(event.start_time)} - {displayDate(event.end_time)}</p>
                                        {event.location ? <p className="mt-1 text-sm text-neutral-500">{event.location}</p> : null}
                                        {event.description ? <p className="mt-3 whitespace-pre-wrap text-sm text-neutral-700">{event.description}</p> : null}
                                    </div>
                                    <div className="flex shrink-0 gap-2">
                                        <button type="button" disabled={isPending} onClick={() => openEdit(event)} className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50">Edit</button>
                                        <button type="button" disabled={isPending} onClick={() => remove(event)} className="rounded-md border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50">Delete</button>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            )}
        </section>
    );
}