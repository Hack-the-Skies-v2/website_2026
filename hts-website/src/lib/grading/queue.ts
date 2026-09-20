/** Ordered id list helpers for organizer review click-through. */

export type ReviewPriorityApp = {
  id: string;
  grader_count: number;
  /** True when this organizer already saved a complete grade. */
  graded_by_me: boolean;
  submitted_at: string;
};

/**
 * Fair review order: apps you have not graded yet, with the fewest existing
 * grades first, then apps that already have more grades. Oldest submission
 * breaks ties so the queue stays stable.
 */
export function prioritizeForReview<T extends ReviewPriorityApp>(apps: T[]): T[] {
  return [...apps].sort((a, b) => {
    if (a.graded_by_me !== b.graded_by_me) {
      return a.graded_by_me ? 1 : -1;
    }
    if (a.grader_count !== b.grader_count) {
      return a.grader_count - b.grader_count;
    }
    return new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime();
  });
}

export function queuePosition(ids: string[], currentId: string) {
  const index = ids.indexOf(currentId);
  return {
    index,
    position: index >= 0 ? index + 1 : null,
    total: ids.length,
    previousId: index > 0 ? ids[index - 1] : null,
    nextId: index >= 0 && index < ids.length - 1 ? ids[index + 1] : null,
  };
}

/**
 * Where to go after Accept / Reject / Not sure.
 * Prefer the next pending in this track; otherwise the next app in the full track list.
 */
export function advanceAfterDecision(
  allIds: string[],
  pendingIds: string[],
  currentId: string,
): string | null {
  const pendingIndex = pendingIds.indexOf(currentId);
  if (pendingIndex >= 0 && pendingIndex + 1 < pendingIds.length) {
    return pendingIds[pendingIndex + 1];
  }

  const laterPending = pendingIds.find((id) => id !== currentId);
  if (laterPending) return laterPending;

  const allIndex = allIds.indexOf(currentId);
  if (allIndex >= 0 && allIndex + 1 < allIds.length) {
    return allIds[allIndex + 1];
  }

  return null;
}
