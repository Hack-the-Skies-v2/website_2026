"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import AccountMenu from "@/components/AccountMenu";
import PortalSchedule, { type PortalScheduleEvent } from "@/components/PortalSchedule";

type PortalTab = "Application Status" | "Schedule" | "Points" | "Shop" | "QR code";

type HackerPortalProps = {
    name: string;
    email: string;
    points: number;
    qrCode?: string | null;
    schedule: PortalScheduleEvent[];
    referralCode?: string | null;
};

const tabs: PortalTab[] = ["Application Status", "Schedule", "Points", "Shop", "QR code"];

function ReferralCard({ referralCode }: { referralCode: string }) {
    const [copied, setCopied] = useState(false);
    const [origin, setOrigin] = useState("");

    useEffect(() => {
        setOrigin(window.location.origin);
    }, []);

    const referralUrl = origin
        ? `${origin}/apply?ref=${referralCode}`
        : `/apply?ref=${referralCode}`;

    function handleCopy() {
        const fullUrl = `${window.location.origin}/apply?ref=${referralCode}`;
        navigator.clipboard.writeText(fullUrl).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    }

    return (
        <div className="rounded-2xl border border-primary/20 bg-[#141123] p-6 space-y-4">
            <div>
                <p className="font-semibold text-primary">Your Referral Link</p>
                <p className="mt-1 text-sm text-primary/60">Share this link to earn points for each referral when they check in to the event, which you can redeem for prizes later at the event.</p>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-primary/20 bg-[#141123] px-4 py-2.5">
                <span className="min-w-0 flex-1 truncate font-mono text-sm text-primary/80 select-all">
                    {referralUrl}
                </span>
                <button
                    type="button"
                    onClick={handleCopy}
                    className="shrink-0 rounded-lg bg-button px-4 py-1.5 text-sm font-medium text-white transition hover:bg-[#8268B4] cursor-pointer"
                >
                    {copied ? "Copied!" : "Copy"}
                </button>
            </div>
        </div>
    );
}

export default function HackerPortal({
    name,
    email,
    points,
    referralCode,
	schedule,
}: HackerPortalProps) {
    const [activeTab, setActiveTab] = useState<PortalTab>("Application Status");

    return (
        <main className="relative z-10 min-h-screen bg-[#141123] font-outfit text-primary">
            <div className="grid min-h-screen w-full lg:grid-cols-[15rem_1fr]">
                <aside className="relative border-b border-primary/15 bg-[#141123] px-5 py-6 lg:border-b-0 lg:border-r lg:px-6">
                    <div className="mb-8 px-3 pt-2">
                        <Link href="/" className="group inline-flex items-center gap-3 transition hover:opacity-85">
                            <img
                                src="/favicon.ico"
                                alt="Hack the Skies"
                                className="h-6 w-6 object-contain drop-shadow-[0_0_8px_rgba(193,185,242,0.45)] transition group-hover:scale-105"
                            />
                            <span className="text-xl font-semibold text-primary">Hacker Portal</span>
                        </Link>
                    </div>
                    <nav aria-label="Hacker portal sections" className="space-y-1">
                        {tabs.map((tab) => (
                            <button
                                key={tab}
                                type="button"
                                onClick={() => setActiveTab(tab)}
                                className={`w-full rounded-xl px-3 py-2.5 text-left text-sm transition cursor-pointer ${activeTab === tab
                                    ? "bg-button font-semibold text-white shadow-[0_0_18px_rgba(130,104,180,0.35)]"
                                    : "text-primary/60 hover:bg-primary/10 hover:text-primary"
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </nav>
                    <div className="mt-10 border-t border-primary/15 px-3 pt-5 text-sm">
                        <AccountMenu email={email} label={name} placement="inline" />
                    </div>
                </aside>

                <section className="min-w-0 bg-[#141123] px-5 py-8 sm:px-8 lg:px-12 lg:py-12">
                    <header className="mb-8 border-b border-primary/15 pb-6">
                        <h1 className="text-2xl font-semibold text-primary sm:text-3xl">{activeTab}</h1>
                    </header>

                    {activeTab === "Application Status" && (
                        <div className="max-w-3xl space-y-6">
                            <div className="rounded-2xl border border-primary/20 bg-[#141123] p-6">
                                <div className="flex items-center justify-between">
                                    <p className="font-semibold text-primary">Hacker Application Status</p>
                                    <span className="text-sm font-medium text-neutral-300">
                                        Pending
                                    </span>
                                </div>
                            </div>
                            {referralCode && <ReferralCard referralCode={referralCode} />}
                        </div>
                    )}

                    {activeTab === "Schedule" && (
                <PortalSchedule events={schedule} />
                    )}

                    {activeTab === "Points" && (
                        <div className="max-w-3xl space-y-6">
                            <div className="rounded-2xl border border-primary/20 bg-[#141123] p-6 sm:p-8">
                                <p className="text-sm font-medium text-primary/60">Current Balance</p>
                                <div className="mt-2 flex items-baseline gap-2">
                                    <span className="text-4xl font-bold text-primary sm:text-5xl">{points}</span>
                                    <span className="text-lg font-medium text-primary/70">Points</span>
                                </div>
                                <p className="mt-4 text-sm leading-relaxed text-primary/70">
                                    You will earn points for each referral when they check in, which you can redeem for prizes later at the event. You can also earn points from workshops, games, and other opportunities.
                                </p>
                            </div>
                        </div>
                    )}

                    {activeTab === "Shop" && (
                        <div className="flex min-h-64 max-w-2xl flex-col items-center justify-center rounded-2xl border border-primary/20 bg-[#141123] p-8 text-center sm:p-12">
                            <h2 className="text-2xl font-semibold text-primary sm:text-3xl">Coming Soon</h2>
                        </div>
                    )}

                    {activeTab === "QR code" && (
                        <div className="flex min-h-64 max-w-2xl flex-col items-center justify-center rounded-2xl border border-primary/20 bg-[#141123] p-8 text-center sm:p-12">
                            <h2 className="text-2xl font-semibold text-primary sm:text-3xl">Coming Soon</h2>
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
}