export type PortalScheduleEvent = {
    id: string;
    title: string;
    description: string;
    type: string;
    start_time: string;
    end_time: string;
    location: string;
};

function formatDate(value: string) {
    return new Date(value).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}

export default function PortalSchedule({ events }: { events: PortalScheduleEvent[] }) {
    if (events.length === 0) {
        return (
            <div className="flex min-h-64 max-w-3xl items-center justify-center rounded-2xl border border-primary/20 bg-[#141123] p-8 text-center text-primary/60">
                No schedule events yet.
            </div>
        );
    }

    return (
        <div className="max-w-3xl divide-y divide-primary/15 overflow-hidden rounded-2xl border border-primary/20 bg-[#141123]">
            {events.map((event) => (
                <article key={event.id} className="p-5 sm:p-6">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <h2 className="text-lg font-semibold text-primary">{event.title}</h2>
                            </div>
                            <p className="mt-1 text-sm text-primary/65">
                                {formatDate(event.start_time)} - {formatDate(event.end_time)}
                            </p>
                            {event.location ? <p className="mt-1 text-sm text-primary/55">{event.location}</p> : null}
                        </div>
                    </div>
                    {event.description ? <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-primary/75">{event.description}</p> : null}
                </article>
            ))}
        </div>
    );
}