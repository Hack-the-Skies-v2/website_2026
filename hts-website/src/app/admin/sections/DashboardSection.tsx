import React from "react";
import { Application, Attendance, Score, Section, User } from "../types";
import { Header, Stat } from "../components/Common";

type Props = {
  applications: Application[];
  users: User[];
  meals: Attendance[];
  workshops: Attendance[];
  scores: Score[];
  judgingSlots: number;
  checkedIn: number;
  accepted: number;
  pending: number;
  setSection: (section: Section) => void;
};

export default function DashboardSection({
  applications,
  users,
  meals,
  workshops,
  scores,
  judgingSlots,
  checkedIn,
  accepted,
  pending,
  setSection,
}: Props) {
  return (
    <>
      <Header
        label="Event overview"
        title="Dashboard"
        description="Event overview and current operations."
        action={
          <button
            className="rounded-lg bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-200"
            onClick={() => setSection("QR Scanner")}
          >
            Open QR scanner
          </button>
        }
      />
      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Applications"
          value={applications.length}
          detail={`${pending} pending review`}
        />
        <Stat
          label="Accepted hackers"
          value={accepted}
          detail="Across 3 active teams"
        />
        <Stat
          label="Checked in"
          value={`${checkedIn}/${users.length}`}
          detail={`${users.length - checkedIn} still expected`}
        />
        <Stat
          label="Judging progress"
          value={`${scores.length}/${judgingSlots}`}
          detail="team-track slots judged"
        />
      </div>
    </>
  );
}
