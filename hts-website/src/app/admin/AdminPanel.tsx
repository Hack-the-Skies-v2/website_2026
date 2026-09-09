"use client";

import { useState } from "react";
import {
  applicationsSeed,
  customEventsSeed,
  mealsSeed,
  referralsSeed,
  scoresSeed,
  teamsSeed,
  tracksSeed,
  transactionsSeed,
  usersSeed,
  workshopsSeed,
} from "./data/seeds";
import ApplicationsSection from "./sections/ApplicationsSection";
import AttendanceSection from "./sections/AttendanceSection";
import CheckInSection from "./sections/CheckInSection";
import DashboardSection from "./sections/DashboardSection";
import JudgingSection from "./sections/JudgingSection";
import ParticipantsSection from "./sections/ParticipantsSection";
import PointsSection from "./sections/PointsSection";
import QRScannerSection from "./sections/QRScannerSection";
import ReferralsSection from "./sections/ReferralsSection";
import ScheduleSection from "./sections/ScheduleSection";
import TeamsSection from "./sections/TeamsSection";
import TracksSection from "./sections/TracksSection";
import { Section } from "./types";

const sections: Section[] = [
  "Dashboard",
  "Schedule",
  "QR Scanner",
  "Applications",
  "Participants",
  "Check-in",
  "Teams",
  "Tracks",
  "Judging",
  "Meals",
  "Workshops",
  "Referrals",
  "Points",
];

export default function AdminPanel() {
  const [section, setSection] = useState<Section>("Dashboard");
  const [applications, setApplications] = useState(applicationsSeed);
  const [users, setUsers] = useState(usersSeed);
  const [teams, setTeams] = useState(teamsSeed);
  const [tracks, setTracks] = useState(tracksSeed);
  const [meals, setMeals] = useState(mealsSeed);
  const [workshops, setWorkshops] = useState(workshopsSeed);
  const [customEvents, setCustomEvents] = useState(customEventsSeed);
  const [scores] = useState(scoresSeed);
  const [transactions, setTransactions] = useState(transactionsSeed);
  const [query, setQuery] = useState("");
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [teamId, setTeamId] = useState<string | null>(null);
  const [toast, setToast] = useState("");

  const checkedIn = users.filter((user) => user.checkedIn).length;
  const accepted = applications.filter(
    (app) => app.status === "Accepted",
  ).length;
  const pending = applications.filter((app) => app.status === "Pending").length;
  const judgingSlots = teams.reduce(
    (total, team) => total + team.trackIds.length,
    0,
  );

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2200);
  };

  const toggleCheckin = (id: string) => {
    setUsers((current) =>
      current.map((user) =>
        user.id === id ? { ...user, checkedIn: !user.checkedIn } : user,
      ),
    );
    notify("Participant status updated");
  };

  return (
    <main className="relative z-10 min-h-screen isolate bg-white text-slate-900 lg:grid lg:grid-cols-[15rem_1fr]">
      <aside className="hidden border-r border-slate-200 bg-slate-50 p-5 lg:block">
        <nav className="space-y-1">
          {sections.map((item) => (
            <button
              className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${section === item ? "bg-amber-300 font-semibold text-slate-950" : "text-slate-600 hover:bg-slate-200 hover:text-slate-950"}`}
              key={item}
              onClick={() => {
                setSection(item);
                setQuery("");
              }}
            >
              {item === "Check-in" ? "Check-in desk" : item}
            </button>
          ))}
        </nav>
      </aside>
      <section className="min-w-0 p-4 sm:p-6 lg:p-8 [&_input]:rounded-lg [&_input]:border [&_input]:border-slate-300 [&_input]:bg-white [&_input]:px-3 [&_input]:py-2 [&_input]:text-sm [&_input]:text-slate-900 [&_input]:shadow-sm [&_input]:outline-none [&_input]:focus:border-amber-400 [&_input]:focus:ring-2 [&_input]:focus:ring-amber-100 [&_select]:rounded-lg [&_select]:border [&_select]:border-slate-300 [&_select]:bg-white [&_select]:px-3 [&_select]:py-2 [&_select]:text-sm [&_select]:text-slate-900 [&_select]:shadow-sm [&_textarea]:rounded-lg [&_textarea]:border [&_textarea]:border-slate-300 [&_textarea]:bg-white [&_textarea]:px-3 [&_textarea]:py-2 [&_textarea]:text-sm [&_textarea]:text-slate-900 [&_textarea]:shadow-sm [&_textarea]:outline-none [&_textarea]:focus:border-amber-400 [&_textarea]:focus:ring-2 [&_textarea]:focus:ring-amber-100 [&_table]:w-full [&_thead]:bg-slate-50 [&_th]:whitespace-nowrap [&_th]:border-b [&_th]:border-slate-200 [&_th]:px-4 [&_th]:py-3 [&_th]:text-left [&_th]:text-xs [&_th]:font-semibold [&_th]:uppercase [&_th]:tracking-wide [&_th]:text-slate-500 [&_td]:border-b [&_td]:border-slate-100 [&_td]:px-4 [&_td]:py-4 [&_td]:text-sm [&_td]:text-slate-700 [&_tbody_tr:hover]:bg-slate-50 [&_.bg-slate-900]:bg-white [&_.bg-slate-950]:bg-white [&_.border-slate-800]:border-slate-200 [&_.text-white]:text-slate-900 [&_.text-slate-100]:text-slate-700 [&_.text-slate-200]:text-slate-700 [&_.text-slate-300]:text-slate-600 [&_.text-slate-400]:text-slate-500">
        {section === "Dashboard" && (
          <DashboardSection
            applications={applications}
            users={users}
            meals={meals}
            workshops={workshops}
            scores={scores}
            judgingSlots={judgingSlots}
            checkedIn={checkedIn}
            accepted={accepted}
            pending={pending}
            setSection={setSection}
          />
        )}

        {section === "Schedule" && (
          <ScheduleSection
            meals={meals}
            workshops={workshops}
            customEvents={customEvents}
            setCustomEvents={setCustomEvents}
            setSection={setSection}
            notify={notify}
          />
        )}

        {section === "QR Scanner" && (
          <QRScannerSection
            users={users}
            setUsers={setUsers}
            meals={meals}
            setMeals={setMeals}
            workshops={workshops}
            setWorkshops={setWorkshops}
            teams={teams}
            notify={notify}
          />
        )}

        {section === "Applications" && (
          <ApplicationsSection
            applications={applications}
            setApplications={setApplications}
            applicationId={applicationId}
            setApplicationId={setApplicationId}
          />
        )}

        {section === "Participants" && (
          <ParticipantsSection
            users={users}
            teams={teams}
            transactions={transactions}
            userId={userId}
            setUserId={setUserId}
            toggleCheckin={toggleCheckin}
          />
        )}

        {section === "Check-in" && (
          <CheckInSection
            users={users}
            teams={teams}
            checkedIn={checkedIn}
            query={query}
            setQuery={setQuery}
            toggleCheckin={toggleCheckin}
          />
        )}

        {section === "Teams" && (
          <TeamsSection
            teams={teams}
            setTeams={setTeams}
            users={users}
            tracks={tracks}
            scores={scores}
            teamId={teamId}
            setTeamId={setTeamId}
          />
        )}

        {section === "Tracks" && (
          <TracksSection
            tracks={tracks}
            setTracks={setTracks}
            teams={teams}
            scores={scores}
            notify={notify}
          />
        )}

        {section === "Judging" && (
          <JudgingSection
            scores={scores}
            teams={teams}
            tracks={tracks}
            users={users}
          />
        )}

        {section === "Meals" && (
          <AttendanceSection
            kind="meal"
            records={meals}
            setRecords={setMeals}
            users={users}
            notify={notify}
          />
        )}

        {section === "Workshops" && (
          <AttendanceSection
            kind="workshop"
            records={workshops}
            setRecords={setWorkshops}
            users={users}
            notify={notify}
          />
        )}

        {section === "Referrals" && (
          <ReferralsSection referrals={referralsSeed} users={users} />
        )}

        {section === "Points" && (
          <PointsSection
            users={users}
            setUsers={setUsers}
            transactions={transactions}
            setTransactions={setTransactions}
            notify={notify}
          />
        )}
      </section>
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 rounded-lg bg-emerald-500 px-4 py-3 text-sm font-semibold text-white shadow-xl">
          {toast}
        </div>
      )}
    </main>
  );
}
