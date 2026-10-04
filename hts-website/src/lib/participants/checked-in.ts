import "server-only";

import { createClient } from "@/lib/supabase/server";

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

type UserRow = {
  id: string;
  hacker: boolean | null;
  mentor: boolean | null;
  judge: boolean | null;
};

function rolesOf(row: UserRow): ParticipantRole[] {
  const roles: ParticipantRole[] = [];
  if (row.hacker) roles.push("hacker");
  if (row.mentor) roles.push("mentor");
  if (row.judge) roles.push("judge");
  return roles;
}

function displayName(first: string, last: string, fallback: string) {
  const name = `${first} ${last}`.trim();
  return name || fallback;
}

export async function listCheckedIn(): Promise<CheckedInPerson[]> {
  const supabase = await createClient();
  const { data: users, error } = await supabase
    .from("users")
    .select("id, hacker, mentor, judge")
    .eq("checked_in", true);

  if (error) throw new Error(error.message);
  const rows = (users ?? []) as UserRow[];
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
        .select("user_id, application_type")
        .in("user_id", ids),
      supabase.from("hacker_applications").select("user_id, first_name, last_name, email").in("user_id", ids),
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
      }[]
    ).map((row) => [row.user_id, row]),
  );
  const hackerById = new Map(
    ((hackers ?? []) as { user_id: string; first_name: string | null; last_name: string | null; email: string | null }[]).map(
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
      const roles = rolesOf(row);
      if (roles.length === 0 && (fromApp === "hacker" || fromApp === "mentor" || fromApp === "judge")) {
        roles.push(fromApp);
      }
      const email = hacker?.email || "";
      const name =
        displayName(hacker?.first_name || "", hacker?.last_name || "", "") ||
        mentor?.name?.trim() ||
        judge?.name?.trim() ||
        email ||
        "Participant";
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

export type HackerSearchResult = {
  id: string;
  name: string;
  email: string;
  points: number;
  checkedIn: boolean;
};

export async function listHackers(): Promise<HackerSearchResult[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("hacker_applications")
    .select("user_id, first_name, last_name, email");
  if (error) throw new Error(error.message);

  const hackers = (data ?? []) as {
    user_id: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  }[];
  if (hackers.length === 0) return [];

  const ids = hackers.map((row) => row.user_id);
  const [{ data: balances, error: balancesError }, { data: users, error: usersError }] = await Promise.all([
    supabase.from("user_points").select("user_id, balance").in("user_id", ids),
    supabase.from("users").select("id, checked_in").in("id", ids),
  ]);
  if (balancesError) throw new Error(balancesError.message);
  if (usersError) throw new Error(usersError.message);

  const pointsById = new Map(
    ((balances ?? []) as { user_id: string; balance: number | null }[]).map((row) => [row.user_id, row.balance ?? 0]),
  );
  const checkedInById = new Map(
    ((users ?? []) as { id: string; checked_in: boolean | null }[]).map((row) => [row.id, Boolean(row.checked_in)]),
  );

  return hackers
    .map((row) => ({
      id: row.user_id,
      name: displayName(row.first_name || "", row.last_name || "", "") || row.email || "Hacker",
      email: row.email || "",
      points: pointsById.get(row.user_id) ?? 0,
      checkedIn: checkedInById.get(row.user_id) ?? false,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function getCheckedInDetail(userId: string): Promise<CheckedInDetail | null> {
  const supabase = await createClient();
  const { data: user, error } = await supabase
    .from("users")
    .select("id, hacker, mentor, judge")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!user) return null;

  const [{ data: app }, { data: hacker }, { data: mentor }, { data: judge }, { data: balance }] =
    await Promise.all([
      supabase.from("applications").select("application_type").eq("user_id", userId).maybeSingle(),
      supabase.from("hacker_applications").select("first_name, last_name, email").eq("user_id", userId).maybeSingle(),
      supabase.from("mentor_applications").select("name").eq("user_id", userId).maybeSingle(),
      supabase.from("judge_applications").select("name").eq("user_id", userId).maybeSingle(),
      supabase.from("user_points").select("balance").eq("user_id", userId).maybeSingle(),
    ]);

  const row = user as UserRow;
  const application = app as { application_type: string | null } | null;
  const hackerRow = hacker as { first_name: string | null; last_name: string | null; email: string | null } | null;
  const mentorRow = mentor as { name: string | null } | null;
  const judgeRow = judge as { name: string | null } | null;
  const fromApp = (application?.application_type || "").toLowerCase();
  const roles = rolesOf(row);
  if (roles.length === 0 && (fromApp === "hacker" || fromApp === "mentor" || fromApp === "judge")) {
    roles.push(fromApp);
  }
  const email = hackerRow?.email || "";
  const person: CheckedInPerson = {
    id: row.id,
    name:
      displayName(hackerRow?.first_name || "", hackerRow?.last_name || "", "") ||
      mentorRow?.name?.trim() ||
      judgeRow?.name?.trim() ||
      email ||
      "Participant",
    email,
    roles,
    points: (balance as { balance: number | null } | null)?.balance ?? 0,
  };
  const [
    { data: attendance, error: attendanceError },
    { data: earnings, error: earningsError },
    { data: adjustments, error: adjustmentsError },
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
  ]);
  if (attendanceError) throw new Error(attendanceError.message);
  if (earningsError) throw new Error(earningsError.message);
  if (adjustmentsError) throw new Error(adjustmentsError.message);

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

  events.sort((a, b) => a.at.localeCompare(b.at));
  const pointsLog = [...earned, ...adjusted].sort((a, b) => b.at.localeCompare(a.at));

  return { ...person, events, pointsLog };
}
