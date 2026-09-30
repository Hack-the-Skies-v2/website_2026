"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

const TOAST_CONFIG = {
    success: {
        text: "Referral successfully added!",
        border: "border-emerald-500/40 shadow-[0_0_35px_rgba(16,185,129,0.3)]",
        textCol: "text-emerald-300",
        btnCol: "text-emerald-400/60 hover:text-emerald-200",
    },
    already_referred: {
        text: "Referral already applied to your account!",
        border: "border-sky-500/40 shadow-[0_0_35px_rgba(14,165,233,0.3)]",
        textCol: "text-sky-300",
        btnCol: "text-sky-400/60 hover:text-sky-200",
    },
    self: {
        text: "You cannot use your own referral code",
        border: "border-violet-500/40 shadow-[0_0_35px_rgba(139,92,246,0.3)]",
        textCol: "text-violet-300",
        btnCol: "text-violet-400/60 hover:text-violet-200",
    },
    invalid: {
        text: "Invalid referral link",
        border: "border-amber-400/40 shadow-[0_0_35px_rgba(245,158,11,0.25)]",
        textCol: "text-amber-300",
        btnCol: "text-amber-400/60 hover:text-amber-200",
    },
} as const;

type ToastType = keyof typeof TOAST_CONFIG;

export default function ReferralToast() {
    const searchParams = useSearchParams();
    const referralParam = searchParams.get("referral");
    const type: ToastType | null =
        referralParam && referralParam in TOAST_CONFIG
            ? (referralParam as ToastType)
            : null;
    const [visibleType, setVisibleType] = useState<ToastType | null>(type);

    useEffect(() => {
        if (!type) {
            setVisibleType(null);
            return;
        }
        setVisibleType(type);

        const timer = setTimeout(() => {
            setVisibleType(null);
            const url = new URL(window.location.href);
            url.searchParams.delete("referral");
            window.history.replaceState({}, "", url.toString());
        }, 4000);

        return () => clearTimeout(timer);
    }, [type]);

    if (!visibleType) return null;

    const current = TOAST_CONFIG[visibleType];

    return (
        <aside
            aria-live="polite"
            aria-atomic="true"
            className="fixed bottom-6 sm:bottom-8 inset-x-0 z-50 pointer-events-none flex justify-center px-4"
        >
            <div
                className={`pointer-events-auto toast-slide-up flex items-center justify-between gap-4 w-full max-w-md rounded-2xl border bg-[#1a1530]/95 backdrop-blur-md px-5 py-3.5 ${current.border}`}
            >
                <div className="flex items-center gap-3">
                    <p className={`font-outfit text-sm md:text-base font-medium ${current.textCol}`}>
                        {current.text}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => {
                        setVisibleType(null);
                        const url = new URL(window.location.href);
                        url.searchParams.delete("referral");
                        window.history.replaceState({}, "", url.toString());
                    }}
                    className={`cursor-pointer transition-colors p-1 ${current.btnCol}`}
                    aria-label="Dismiss notification"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </aside>
    );
}
