import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export type ParticipantRole = "hacker" | "mentor" | "judge";

export type CheckedInPerson = {
  id: string;
  name: string;
  email: string;
  roles: ParticipantRole[];
  points: number;
};

export type AttendedEvent = {
  id: string;
  name: string;
  kind: string;
  at: string;
};

export type PointEntry = {
  id: string;
  amount: number;
  reason: string;
  at: string;
};

export type CheckedInDetail = CheckedInPerson & {
  events: AttendedEvent[];
  pointsLog: PointEntry[];
};

function displayName(first: string, last: string, fallback: string) {
  const name = `${first} ${last}`.trim();
  return name || fallback;
}

function resolveParticipantName(
  applicationType: string,
  hacker: { first_name: string | null; last_name: string | null; preferred_name: string | null } | undefined,
  mentor: { name: string | null } | undefined,
  judge: { name: string | null } | undefined,
) {
  const type = applicationType.toLowerCase();
  let name = "Participant";
  if (type === "hacker" && hacker?.preferred_name?.trim()) {
    name = hacker.preferred_name.trim();
  } else if (type === "hacker" && displayName(hacker?.first_name || "", hacker?.last_name || "", "")) {
    name = displayName(hacker?.first_name || "", hacker?.last_name || "", "");
  } else if (type === "mentor" && mentor?.name?.trim()) {
    name = mentor.name.trim();
  } else if (type === "judge" && judge?.name?.trim()) {
    name = judge.name.trim();
  } else if (!type && hacker?.preferred_name?.trim()) {
    name = hacker.preferred_name.trim();
  } else if (!type && displayName(hacker?.first_name || "", hacker?.last_name || "", "")) {
    name = displayName(hacker?.first_name || "", hacker?.last_name || "", "");
  } else if (!type && mentor?.name?.trim()) {
    name = mentor.name.trim();
  } else if (!type && judge?.name?.trim()) {
    name = judge.name.trim();
  }

  return name;
}

export async function listCheckedIn(): Promise<CheckedInPerson[]> {
  const supabase = createAdminClient();
  const { data: attendance, error: attendanceError } = await supabase
    .from("schedule_attendance")
    .select("user_id");

  if (attendanceError) throw new Error(attendanceError.message);
  const checkedInIds = [...new Set((attendance ?? []).map((row) => row.user_id).filter(Boolean))];
  if (checkedInIds.length === 0) return [];

  const { data: users, error: usersError } = await supabase
    .from("users")
    .select("id")
    .in("id", checkedInIds);

  if (usersError) throw new Error(usersError.message);
  const rows = (users ?? []) as { id: string }[];
  if (rows.length === 0) return [];

  const ids = rows.map((row) => row.id);
  const [
    { data: apps, error: appsError },
    { data: hackers, error: hackersError },
    { data: mentors, error: mentorsError },
    { data: judges, error: judgesError },
    { data: balances, error: balancesError },
  ] = await Promise.all([
      supabase
        .from("applications")
        .select("user_id, application_type, status")
        .in("user_id", ids),
      supabase.from("hacker_applications").select("user_id, first_name, last_name, preferred_name, email").in("user_id", ids),
      supabase.from("mentor_applications").select("user_id, name").in("user_id", ids),
      supabase.from("judge_applications").select("user_id, name").in("user_id", ids),
      supabase.from("user_points").select("user_id, balance").in("user_id", ids),
    ]);
  const lookupError = appsError || hackersError || mentorsError || judgesError || balancesError;
  if (lookupError) throw new Error(lookupError.message);

  const appById = new Map(
    (
      (apps ?? []) as {
        user_id: string;
        application_type: string | null;
        status: string | null;
      }[]
    ).map((row) => [row.user_id, row]),
  );
  const hackerById = new Map(
    ((hackers ?? []) as { user_id: string; first_name: string | null; last_name: string | null; preferred_name: string | null; email: string | null }[]).map(
      (row) => [row.user_id, row],
    ),
  );
  const mentorById = new Map(
    ((mentors ?? []) as { user_id: string; name: string | null }[]).map((row) => [row.user_id, row]),
  );
  const judgeById = new Map(
    ((judges ?? []) as { user_id: string; name: string | null }[]).map((row) => [row.user_id, row]),
  );
  const pointsById = new Map(
    ((balances ?? []) as { user_id: string; balance: number | null }[]).map((row) => [row.user_id, row.balance ?? 0]),
  );

  return rows
    .map((row) => {
      const app = appById.get(row.id);
      const hacker = hackerById.get(row.id);
      const mentor = mentorById.get(row.id);
      const judge = judgeById.get(row.id);
      const fromApp = (app?.application_type || "").toLowerCase();
      const roles: ParticipantRole[] = [];
      if (fromApp === "judge" && app?.status === "accepted") {
        roles.push("judge");
      } else if (fromApp === "hacker" || fromApp === "mentor") {
        roles.push(fromApp);
      }
      const email = hacker?.email || "";
      const name = resolveParticipantName(fromApp, hacker, mentor, judge);
      return {
        id: row.id,
        name,
        email,
        roles,
        points: pointsById.get(row.id) ?? 0,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function getCheckedInDetail(userId: string): Promise<CheckedInDetail | null> {
  const supabase = createAdminClient();
  const { data: user, error } = await supabase
    .from("users")
    .select("id")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!user) return null;

  const [{ data: app }, { data: hacker }, { data: mentor }, { data: judge }, { data: balance }] =
    await Promise.all([
      supabase.from("applications").select("application_type, status").eq("user_id", userId).maybeSingle(),
      supabase.from("hacker_applications").select("first_name, last_name, preferred_name, email").eq("user_id", userId).maybeSingle(),
      supabase.from("mentor_applications").select("name").eq("user_id", userId).maybeSingle(),
      supabase.from("judge_applications").select("name").eq("user_id", userId).maybeSingle(),
      supabase.from("user_points").select("balance").eq("user_id", userId).maybeSingle(),
    ]);

  const row = user as { id: string };
  const application = app as { application_type: string | null; status: string | null } | null;
  const hackerRow = hacker as { first_name: string | null; last_name: string | null; preferred_name: string | null; email: string | null } | null;
  const mentorRow = mentor as { name: string | null } | null;
  const judgeRow = judge as { name: string | null } | null;
  const fromApp = (application?.application_type || "").toLowerCase();
  const roles: ParticipantRole[] = [];
  if (fromApp === "judge" && application?.status === "accepted") {
    roles.push("judge");
  } else if (fromApp === "hacker" || fromApp === "mentor") {
    roles.push(fromApp);
  }
  const email = hackerRow?.email || "";
  const person: CheckedInPerson = {
    id: row.id,
    name: resolveParticipantName(fromApp, hackerRow ?? undefined, mentorRow ?? undefined, judgeRow ?? undefined),
    email,
    roles,
    points: (balance as { balance: number | null } | null)?.balance ?? 0,
  };
  const [
    { data: attendance, error: attendanceError },
    { data: earnings, error: earningsError },
    { data: adjustments, error: adjustmentsError },
    { data: prizeRedemptions, error: prizeRedemptionsError },
  ] = await Promise.all([
    supabase
      .from("schedule_attendance")
      .select("event_id, created_at, schedule_events(title, type)")
      .eq("user_id", userId),
    supabase
      .from("point_earnings")
      .select("id, points_awarded, created_at, point_actions(name)")
      .eq("user_id", userId),
    supabase
      .from("point_adjustments")
      .select("id, points, reason, created_at")
      .eq("user_id", userId),
    supabase
      .from("prize_redemptions")
      .select("id, points_spent, created_at, point_prizes(name)")
      .eq("user_id", userId),
  ]);
  if (attendanceError) throw new Error(attendanceError.message);
  if (earningsError) throw new Error(earningsError.message);
  if (adjustmentsError) throw new Error(adjustmentsError.message);
  if (prizeRedemptionsError) throw new Error(prizeRedemptionsError.message);

  const events: AttendedEvent[] = (
    (attendance ?? []) as {
      event_id: string;
      created_at: string;
      schedule_events: { title: string; type: string } | { title: string; type: string }[] | null;
    }[]
  ).map((row) => {
    const event = Array.isArray(row.schedule_events) ? row.schedule_events[0] : row.schedule_events;
    return {
      id: row.event_id,
      name: event?.title || "Event",
      kind: event?.type || "event",
      at: row.created_at,
    };
  });

  const earned: PointEntry[] = (
    (earnings ?? []) as {
      id: string;
      points_awarded: number;
      created_at: string;
      point_actions: { name: string } | { name: string }[] | null;
    }[]
  ).map((row) => {
    const action = Array.isArray(row.point_actions) ? row.point_actions[0] : row.point_actions;
    return {
      id: row.id,
      amount: row.points_awarded,
      reason: action?.name || "Points",
      at: row.created_at,
    };
  });

  const adjusted: PointEntry[] = (
    (adjustments ?? []) as { id: string; points: number; reason: string; created_at: string }[]
  ).map((row) => ({
    id: row.id,
    amount: row.points,
    reason: row.reason,
    at: row.created_at,
  }));

  const prizes: PointEntry[] = (
    (prizeRedemptions ?? []) as {
      id: string;
      points_spent: number;
      created_at: string;
      point_prizes: { name: string } | { name: string }[] | null;
    }[]
  ).map((row) => {
    const prize = Array.isArray(row.point_prizes) ? row.point_prizes[0] : row.point_prizes;
    return {
      id: row.id,
      amount: -row.points_spent,
      reason: `Prize: ${prize?.name || "Purchase"}`,
      at: row.created_at,
    };
  });

  events.sort((a, b) => a.at.localeCompare(b.at));
  const pointsLog = [...earned, ...adjusted, ...prizes].sort((a, b) => b.at.localeCompare(a.at));

  return { ...person, events, pointsLog };
}
