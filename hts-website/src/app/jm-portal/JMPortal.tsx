"use client";

import { useState } from "react";
import Link from "next/link";
import AccountMenu from "@/components/AccountMenu";

type PortalTab = "Application Status" | "Schedule" | "QR code";

type JMPortalProps = {
    name: string;
    email: string;
    role: "Judge" | "Mentor" | "Judge & Mentor";
    isJudge: boolean;
};

const tabs: PortalTab[] = ["Application Status", "Schedule", "QR code"];

export default function JMPortal({
    name,
    email,
    role,
    isJudge,
}: JMPortalProps) {
    const [activeTab, setActiveTab] = useState<PortalTab>("Application Status");

    return (
        <main className="relative z-10 min-h-screen font-outfit text-primary">
            <div className="grid min-h-screen w-full lg:grid-cols-[15rem_1fr]">
                <aside className="relative border-b border-primary/15 px-5 py-6 lg:border-b-0 lg:border-r lg:px-6">
                    <div className="mb-8 px-3 pt-2">
                        <Link href="/" className="group inline-flex items-center gap-2 transition hover:opacity-85">
                            <img
                                src="/favicon.ico"
                                alt="Hack the Skies"
                                className="h-5 w-5 object-contain drop-shadow-[0_0_8px_rgba(193,185,242,0.45)] transition group-hover:scale-105"
                            />
                            <span className="text-xs uppercase tracking-[0.24em] text-primary/50">Hack the Skies</span>
                        </Link>
                        <p className="mt-2 text-xl font-semibold text-primary">{role} Portal</p>
                    </div>

                    <nav aria-label="Judge & Mentor portal sections" className="space-y-2">
                        {tabs.map((tab) => (
                            <button
                                key={tab}
                                type="button"
                                onClick={() => setActiveTab(tab)}
                                className={`w-full rounded-xl px-3 py-3 text-left text-sm transition ${activeTab === tab
                                    ? "bg-button font-semibold text-white shadow-[0_0_18px_rgba(130,104,180,0.35)]"
                                    : "text-primary/60 hover:bg-primary/10 hover:text-primary"
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}

                        {isJudge && (
                            <div className="pt-2">
                                <Link
                                    href="/judge"
                                    className="flex items-center justify-between rounded-xl border border-amber-400/30 bg-amber-400/10 px-3 py-3 text-left text-sm font-semibold text-amber-200 shadow-[0_0_18px_rgba(248,212,114,0.15)] transition hover:border-amber-400/50 hover:bg-amber-400/20"
                                >
                                    <span>Judging Portal</span>
                                    <span className="text-xs">↗</span>
                                </Link>
                            </div>
                        )}
                    </nav>

                    <div className="mt-10 border-t border-primary/15 px-3 pt-5 text-sm">
                        <AccountMenu email={email} label={name} placement="inline" />
                    </div>
                </aside>

                <section className="min-w-0 px-5 py-8 sm:px-8 lg:px-12 lg:py-12">
                    <header className="mb-8 border-b border-primary/15 pb-6">
                        <h1 className="mt-2 text-3xl font-semibold text-primary sm:text-4xl">{activeTab}</h1>
                    </header>

                    {activeTab === "Application Status" && (
                        <div className="max-w-3xl space-y-6">
                            <div className="rounded-2xl border border-primary/15 bg-[#221c38] p-6">
                                <p className="text-sm text-primary/60">Application review</p>
                                <div className="mt-6 flex items-center justify-between">
                                    <div>
                                        <p className="font-semibold text-primary">{role} Application</p>
                                        <p className="mt-1 text-sm text-primary/55">Hack the Skies 2026 · October 17-18 · Toronto</p>
                                    </div>
                                    <span className="rounded-full border border-star/30 bg-star/15 px-3 py-1 text-xs font-semibold text-star">
                                        Pending
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "Schedule" && (
                        <div className="flex min-h-64 max-w-2xl flex-col items-center justify-center rounded-2xl border border-primary/15 bg-[#221c38] p-8 text-center sm:p-12">
                            <h2 className="text-2xl font-semibold text-primary sm:text-3xl">Coming Soon</h2>
                            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-primary/60">
                                The event timeline, workshop tracks, and judging schedules will be released closer to Hack the Skies 2026. Check back soon!
                            </p>
                        </div>
                    )}

                    {activeTab === "QR code" && (
                        <div className="flex min-h-64 max-w-2xl flex-col items-center justify-center rounded-2xl border border-primary/15 bg-[#221c38] p-8 text-center sm:p-12">
                            <h2 className="text-2xl font-semibold text-primary sm:text-3xl">Coming Soon</h2>
                            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-primary/60">
                                Your badge QR code will be generated once admissions decisions are finalized.
                            </p>
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
}
