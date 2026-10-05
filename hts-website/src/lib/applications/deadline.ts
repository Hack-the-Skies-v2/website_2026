const APPLICATION_DEADLINE = Date.parse("2026-10-06T04:00:00.000Z");

export function areApplicationsOpen(): boolean {
    return Date.now() < APPLICATION_DEADLINE;
}
