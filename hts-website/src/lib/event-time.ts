export const EVENT_TIME_ZONE = "America/Toronto";

const dateTimeParts = new Intl.DateTimeFormat("en-CA", {
    timeZone: EVENT_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
});

function partsFor(date: Date) {
    return Object.fromEntries(
        dateTimeParts.formatToParts(date)
            .filter(({ type }) => type !== "literal")
            .map(({ type, value }) => [type, Number(value)]),
    ) as Record<"year" | "month" | "day" | "hour" | "minute", number>;
}

export function eventDateTimeInput(value: string) {
    const parts = partsFor(new Date(value));
    const pad = (part: number) => String(part).padStart(2, "0");
    return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}T${pad(parts.hour)}:${pad(parts.minute)}`;
}

export function eventDateTimeLabel(value: string) {
    return new Intl.DateTimeFormat([], {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        timeZone: EVENT_TIME_ZONE,
        timeZoneName: "short",
    }).format(new Date(value));
}

export function eventLocalDateTimeToUtc(value: string) {
    const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
    if (!match) throw new Error("Event time must be a valid date and time.");

    const [, year, month, day, hour, minute] = match.map(Number);
    const localAsUtc = Date.UTC(year, month - 1, day, hour, minute);
    const offsetAtGuess = partsFor(new Date(localAsUtc));
    const offset = Date.UTC(
        offsetAtGuess.year,
        offsetAtGuess.month - 1,
        offsetAtGuess.day,
        offsetAtGuess.hour,
        offsetAtGuess.minute,
    ) - localAsUtc;
    const result = new Date(localAsUtc - offset);
    if (Number.isNaN(result.getTime())) throw new Error("Event time must be a valid date and time.");
    return result.toISOString();
}
