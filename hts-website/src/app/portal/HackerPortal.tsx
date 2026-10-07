"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import AccountMenu from "@/components/AccountMenu";
import PortalSchedule, { type PortalScheduleEvent } from "@/components/PortalSchedule";
import PortalQRCode from "@/components/PortalQRCode";
import { redeemPrize } from "@/actions/redeemPrize";

type PortalTab = "Application Status" | "Schedule" | "Points" | "Shop" | "QR code";

export type PortalPrize = {
    id: string;
    name: string;
    description: string | null;
    points_required: number;
    quantity: number | null;
    max_redemptions: number | null;
    remaining_quantity: number | null;
};

export type PortalPointAction = {
    id: string;
    name: string;
    description: string | null;
    points: number;
    max_redemptions: number | null;
    active: boolean;
    earned_count: number;
};

type HackerPortalProps = {
    name: string;
    email: string;
    status?: string | null;
    points: number;
    qrCode?: string | null;
    schedule: PortalScheduleEvent[];
    prizes: PortalPrize[];
    userPrizeRedemptionCounts: Record<string, number>;
    pointActions: PortalPointAction[];
};

const tabs: PortalTab[] = ["Application Status", "Schedule", "Points", "Shop", "QR code"];

export default function HackerPortal({
    name,
    email,
    status,
    points,
	qrCode,
	schedule,
	prizes,
	userPrizeRedemptionCounts,
	pointActions,
}: HackerPortalProps) {
    const [activeTab, setActiveTab] = useState<PortalTab>("Application Status");
    const [currentPoints, setCurrentPoints] = useState(points);
    const [redeemingPrizeId, setRedeemingPrizeId] = useState<string | null>(null);
    const [prizeRedemptionCounts, setPrizeRedemptionCounts] = useState<Record<string, number>>(
        () => ({ ...userPrizeRedemptionCounts }),
    );
    const [remainingQuantities, setRemainingQuantities] = useState<Record<string, number | null>>(
        () => Object.fromEntries(prizes.map((prize) => [prize.id, prize.remaining_quantity])),
    );
    const [redemptionError, setRedemptionError] = useState<string | null>(null);
    const [, startTransition] = useTransition();
    const displayStatus = status ? status.charAt(0).toUpperCase() + status.slice(1) : "Pending";

    console.info("[hacker-portal] client status", {
        status,
        displayStatus,
    });

    useEffect(() => {
        if (!redemptionError) return;

        const timeout = window.setTimeout(() => {
            setRedemptionError(null);
        }, 4000);

        return () => window.clearTimeout(timeout);
    }, [redemptionError]);

    function handleRedeem(prizeId: string) {
        setRedemptionError(null);
        setRedeemingPrizeId(prizeId);
        startTransition(async () => {
            try {
                const result = await redeemPrize(prizeId);
                if (!result.success) {
                    setRedemptionError(result.error);
                    return;
                }
                setCurrentPoints(result.balance);
                setPrizeRedemptionCounts((counts) => ({
                    ...counts,
                    [prizeId]: (counts[prizeId] ?? 0) + 1,
                }));
                setRemainingQuantities((quantities) => ({
                    ...quantities,
                    [prizeId]: quantities[prizeId] === null
                        ? null
                        : Math.max((quantities[prizeId] ?? 0) - 1, 0),
                }));
            } catch {
                setRedemptionError("Unable to redeem this prize right now.");
            } finally {
                setRedeemingPrizeId(null);
            }
        });
    }

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
                                    <span className={`text-sm font-medium ${
                                        status === "accepted"
                                            ? "text-emerald-400"
                                            : status === "rejected"
                                                ? "text-red-400"
                                                : "text-neutral-300"
                                    }`}>
                                        {displayStatus}
                                    </span>
                                </div>
                            </div>
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
                                    <span className="text-4xl font-bold text-primary sm:text-5xl">{currentPoints}</span>
                                    <span className="text-lg font-medium text-primary/70">Points</span>
                                </div>
                                <p className="mt-4 text-sm leading-relaxed text-primary/70">
                                    You will earn points for each referral when they check in, which you can redeem for prizes later at the event. You can also earn points from workshops, games, and other opportunities.
                                </p>
                            </div>
                            <div className="space-y-3">
                                <h2 className="text-xl font-semibold text-primary">Ways to earn points</h2>
                                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                                    {pointActions.map((action) => (
                                        <article
                                            key={action.id}
                                            className="flex min-h-56 flex-col rounded-2xl border border-primary/20 bg-[#141123] p-5"
                                        >
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-primary">{action.name}</h3>
                                                {action.description && (
                                                    <p className="mt-2 text-sm leading-relaxed text-primary/65">
                                                        {action.description}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="mt-5 border-t border-primary/10 pt-4">
                                                <p className="text-lg font-semibold text-primary">
                                                    {action.points.toLocaleString()} points
                                                </p>
                                                <div className="mt-2 flex flex-col gap-1 text-sm">
                                                    <span className="text-primary/60">
                                                        Earned {action.earned_count} time{action.earned_count === 1 ? "" : "s"}
                                                    </span>
                                                    <span className="text-primary/50">
                                                        {action.max_redemptions === null
                                                            ? "Unlimited"
                                                            : `Up to ${action.max_redemptions} per user`}
                                                    </span>
                                                </div>
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "Shop" && (
                        <div className="max-w-5xl">
                            <div className="mb-6 rounded-2xl border border-primary/20 bg-[#141123] p-5">
                                <p className="text-sm font-medium text-primary/60">Balance</p>
                                <p className="mt-1 text-3xl font-bold text-primary">
                                    {currentPoints.toLocaleString()} <span className="text-base font-medium text-primary/70">points</span>
                                </p>
                            </div>
                            <p className="mb-6 text-sm text-primary/70">
                                Go to an organizer to actually receive your prize.
                            </p>
                            {redemptionError && (
                                <p role="alert" className="mb-6 rounded-xl border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-200">
                                    {redemptionError}
                                </p>
                            )}
                            {prizes.length > 0 ? (
                                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                                    {prizes.map((prize) => (
                                        (() => {
                                            const redemptionCount = prizeRedemptionCounts[prize.id] ?? 0;
                                            const redemptionLimitReached =
                                                prize.max_redemptions !== null &&
                                                redemptionCount >= prize.max_redemptions;
                                            const isUnavailable =
                                                redemptionLimitReached ||
                                                remainingQuantities[prize.id] === 0;
                                            return (
                                                <article
                                                    key={prize.id}
                                            className="flex min-h-48 flex-col rounded-2xl border border-primary/20 bg-[#141123] p-5"
                                        >
                                            <img
                                                src="/favicon.ico"
                                                alt=""
                                                className="mb-4 h-16 w-16 rounded-xl object-contain"
                                            />
                                            <div className="flex-1">
                                                <p className="text-lg font-semibold text-primary">{prize.name}</p>
                                                {prize.description && (
                                                    <p className="mt-2 text-sm leading-relaxed text-primary/65">
                                                        {prize.description}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="mt-6 border-t border-primary/10 pt-4">
                                                <div className="flex items-end justify-between gap-3">
                                                    <p className="font-semibold text-primary">
                                                        {prize.points_required.toLocaleString()} points
                                                    </p>
                                                    <p className="text-right text-xs text-primary/55">
                                                        {remainingQuantities[prize.id] === null
                                                            ? "Unlimited quantity"
                                                            : `${remainingQuantities[prize.id]} available`}
                                                    </p>
                                                </div>
                                                {prize.max_redemptions !== null && (
                                                    <p className="mt-2 text-xs text-primary/55">
                                                        Max {prize.max_redemptions} per user
                                                    </p>
                                                )}
                                                <p className="mt-2 text-xs text-primary/70">
                                                    Redeemed {redemptionCount} time{redemptionCount === 1 ? "" : "s"}
                                                </p>
                                                <button
                                                    type="button"
                                                    disabled={redeemingPrizeId === prize.id || isUnavailable}
                                                    onClick={() => handleRedeem(prize.id)}
                                                    className="mt-4 w-full rounded-xl bg-button px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#8268B4] disabled:cursor-not-allowed disabled:opacity-50"
                                                    aria-busy={redeemingPrizeId === prize.id}
                                                >
                                                    {remainingQuantities[prize.id] === 0
                                                            ? "Unavailable"
                                                        : redemptionLimitReached
                                                            ? "Limit reached"
                                                        : redeemingPrizeId === prize.id
                                                            ? "Redeeming..."
                                                            : "Redeem"}
                                                </button>
                                            </div>
                                        </article>
                                    );
                                })()
                                    ))}
                                </div>
                            ) : (
                                <div className="rounded-2xl border border-primary/20 bg-[#141123] p-8 text-center">
                                    <p className="text-primary/70">No prizes are available right now.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === "QR code" && (
                        <PortalQRCode value={qrCode ?? null} />
                    )}
                </section>
            </div>
        </main>
    );
}