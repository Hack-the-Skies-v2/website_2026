"use client";

import { useState } from "react";
import AccountMenu from "@/components/AccountMenu";

type PortalTab = "RSVP" | "Schedule" | "Points" | "Shop" | "QR code";

type ScheduleItem = {
  id: string;
  name: string;
  description: string;
  startsAt: string;
  endsAt: string;
  location: string;
  type: "Workshop" | "Meal";
};

type HackerPortalProps = {
  name: string;
  email: string;
  points: number;
  qrCode: string | null;
  schedule: ScheduleItem[];
};

const tabs: PortalTab[] = ["RSVP", "Schedule", "Points", "Shop", "QR code"];

const pointActivity = [
  { id: "workshop", title: "Joined a workshop", detail: "Placeholder activity", amount: 10 },
  { id: "referral", title: "Referred a friend", detail: "Placeholder activity", amount: 25 },
  { id: "check-in", title: "Event check-in", detail: "Placeholder activity", amount: 15 },
];

const placeholderSchedule: ScheduleItem[] = [
  {
    id: "placeholder-opening",
    name: "Opening ceremony",
    description: "Welcome, event briefing, and team announcements.",
    startsAt: "2026-09-26T09:00:00-04:00",
    endsAt: "2026-09-26T09:45:00-04:00",
    location: "Main auditorium",
    type: "Workshop",
  },
  {
    id: "placeholder-lunch",
    name: "Lunch",
    description: "Take a break, refuel, and meet fellow hackers.",
    startsAt: "2026-09-26T12:30:00-04:00",
    endsAt: "2026-09-26T13:30:00-04:00",
    location: "Dining hall",
    type: "Meal",
  },
  {
    id: "placeholder-workshop",
    name: "Build your first flight dashboard",
    description: "A practical workshop on turning live data into a useful interface.",
    startsAt: "2026-09-26T14:00:00-04:00",
    endsAt: "2026-09-26T15:30:00-04:00",
    location: "Workshop room A",
    type: "Workshop",
  },
  {
    id: "placeholder-dinner",
    name: "Dinner",
    description: "Dinner service for hackers and volunteers.",
    startsAt: "2026-09-26T18:30:00-04:00",
    endsAt: "2026-09-26T20:00:00-04:00",
    location: "Dining hall",
    type: "Meal",
  },
];

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function HackerPortal({
  name,
  email,
  points,
  qrCode,
  schedule,
}: HackerPortalProps) {
  const [activeTab, setActiveTab] = useState<PortalTab>("RSVP");
  const [rsvpStatus, setRsvpStatus] = useState<"Pending" | "Accepted" | "Rejected">("Pending");
  const visibleSchedule = schedule.length > 0 ? schedule : placeholderSchedule;

  return (
    <main className="relative z-10 min-h-screen font-outfit text-primary">
      <div className="grid min-h-screen w-full lg:grid-cols-[15rem_1fr]">
        <aside className="relative border-b border-primary/15 px-5 py-6 lg:border-b-0 lg:border-r lg:px-6">
          <div className="mb-8 px-3 pt-2">
            <p className="text-xs uppercase tracking-[0.24em] text-primary/50">Hack the Skies</p>
            <p className="mt-2 text-xl font-semibold text-primary">Hacker portal</p>
          </div>
          <nav aria-label="Hacker portal sections" className="space-y-2">
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`w-full rounded-xl px-3 py-3 text-left text-sm transition ${activeTab === tab ? "bg-button font-semibold text-white shadow-[0_0_18px_rgba(130,104,180,0.35)]" : "text-primary/60 hover:bg-primary/10 hover:text-primary"}`}
              >
                {tab}
              </button>
            ))}
          </nav>
          <div className="mt-10 border-t border-primary/15 px-3 pt-5 text-sm">
            <AccountMenu email={email} label={name} placement="inline" />
            <p className="mt-4 text-primary/55">Current balance</p>
            <p className="mt-1 text-2xl font-semibold text-star">{points} pts</p>
          </div>
        </aside>

        <section className="min-w-0 px-5 py-8 sm:px-8 lg:px-12 lg:py-12">
          <header className="mb-8 border-b border-primary/15 pb-6">
            <p className="text-sm text-primary/50">Participant space</p>
            <h1 className="mt-2 text-3xl font-semibold text-primary sm:text-4xl">{activeTab}</h1>
          </header>

          {activeTab === "Schedule" && (
            <div className="max-w-5xl">
              <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-primary/15 pb-5">
                <div>
                  <p className="text-sm uppercase tracking-[0.18em] text-primary/45">Saturday, September 26</p>
                  <h2 className="mt-2 text-2xl font-semibold text-primary">Event schedule</h2>
                </div>
                <div className="flex gap-4 text-xs text-primary/55">
                  <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[#c1b9f2]" />Workshop</span>
                  <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[#f8d472]" />Meal</span>
                </div>
              </div>
              <div className="overflow-x-auto">
                <div className="min-w-[36rem] border-y border-primary/15">
                  {visibleSchedule.map((item) => (
                    <article key={item.id} className="grid grid-cols-[5.5rem_1fr] border-b border-primary/10 last:border-b-0">
                      <div className="border-r border-primary/10 py-5 pr-4 text-right">
                        <p className="font-semibold text-star">{formatTime(item.startsAt)}</p>
                        <p className="mt-1 text-xs text-primary/40">{formatTime(item.endsAt)}</p>
                      </div>
                      <div className="p-3">
                        <div className={`min-h-28 rounded-xl border p-4 ${item.type === "Meal" ? "border-star/35 bg-star/10" : "border-primary/30 bg-primary/10"}`}>
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p className="font-semibold text-primary">{item.name}</p>
                              <p className="mt-2 max-w-2xl text-sm leading-6 text-primary/60">{item.description}</p>
                            </div>
                            <span className="shrink-0 text-xs uppercase tracking-[0.16em] text-primary/50">{item.type}</span>
                          </div>
                          <p className="mt-4 text-xs text-primary/50">{item.location}</p>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "Points" && (
            <div className="space-y-8">
              <div className="grid min-w-0 gap-5 sm:grid-cols-2">
                <div className="min-w-0 overflow-hidden rounded-2xl border border-star/30 bg-star/10 p-6">
                  <p className="text-sm text-primary/60">Available to spend</p>
                  <p className="mt-3 text-5xl font-semibold text-star">{points}</p>
                  <p className="mt-2 text-sm text-primary/60">points earned during Hack the Skies</p>
                </div>
                <div className="min-w-0 overflow-hidden rounded-2xl border border-primary/15 bg-[#221c38]/60 p-6">
                  <h2 className="text-lg font-semibold text-primary">How points work</h2>
                  <p className="mt-3 text-sm leading-6 text-primary/60">Earn points by joining workshops, helping your team, and taking part in event activities. Spend them in the shop.</p>
                </div>
              </div>
              <div>
                <div className="mb-4 flex items-end justify-between border-b border-primary/15 pb-3">
                  <div>
                    <p className="text-sm text-primary/50">Activity</p>
                    <h2 className="mt-1 text-2xl font-semibold text-primary">Points history</h2>
                  </div>
                  <span className="text-sm text-primary/45">Placeholder log</span>
                </div>
                <div className="divide-y divide-primary/10 border-y border-primary/10">
                  {pointActivity.map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between gap-4 py-4">
                      <div>
                        <p className="font-semibold text-primary">{activity.title}</p>
                        <p className="mt-1 text-sm text-primary/50">{activity.detail}</p>
                      </div>
                      <span className="shrink-0 font-semibold text-emerald-300">+{activity.amount} pts</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "Shop" && (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {[{ name: "HTS sticker pack", cost: 15 }, { name: "Aviation patch", cost: 30 }, { name: "Pilot hoodie", cost: 75 }].map((item) => (
                <article key={item.name} className="rounded-2xl border border-primary/15 bg-[#221c38] p-5">
                  <div className="flex h-28 items-center justify-center rounded-xl border border-primary/10 bg-[#171329] text-4xl">✦</div>
                  <h2 className="mt-4 font-semibold text-primary">{item.name}</h2>
                  <p className="mt-1 text-sm text-star">{item.cost} points</p>
                  <button type="button" disabled={points < item.cost} className="mt-5 w-full rounded-xl bg-button px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#8268B4] disabled:cursor-not-allowed disabled:opacity-40">{points < item.cost ? "Not enough points" : "Redeem"}</button>
                </article>
              ))}
            </div>
          )}

          {activeTab === "QR code" && (
            <div className="mx-auto max-w-md rounded-2xl border border-primary/15 bg-[#221c38] p-6 text-center">
              <p className="text-sm text-primary/60">Show this code at check-in, meals, and workshops.</p>
              <div className="mx-auto mt-6 flex aspect-square max-w-64 items-center justify-center rounded-xl bg-white p-5 text-4xl font-bold tracking-widest text-[#171329]">{qrCode ?? "PENDING"}</div>
              <p className="mt-5 text-xs uppercase tracking-[0.2em] text-primary/45">Participant QR identifier</p>
            </div>
          )}

          {activeTab === "RSVP" && (
              <div className="max-w-2xl rounded-2xl border border-primary/15 bg-[#221c38] p-6">
              <p className="text-sm text-primary/60">Reserve your place at the in-person event.</p>
              <div className="mt-6 flex items-center justify-between border-b border-primary/10 pb-5">
                <div><p className="font-semibold text-primary">Hack the Skies 2026</p><p className="mt-1 text-sm text-primary/55">September 26-27 · Toronto</p></div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${rsvpStatus === "Accepted" ? "bg-emerald-400/15 text-emerald-200" : rsvpStatus === "Rejected" ? "bg-red-400/15 text-red-200" : "bg-star/15 text-star"}`}>{rsvpStatus}</span>
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <button type="button" onClick={() => setRsvpStatus("Accepted")} className="rounded-xl bg-emerald-500/90 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-400">Accept</button>
                <button type="button" onClick={() => setRsvpStatus("Rejected")} className="rounded-xl border border-red-300/40 px-5 py-3 text-sm font-semibold text-red-200 transition hover:bg-red-400/10">Reject</button>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}