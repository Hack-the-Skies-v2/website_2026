"use client";

import { useEffect, useRef, useState } from "react";
import { deleteCurrentUser, logout } from "@/actions/auth";

type AccountMenuProps = {
    email: string;
    label?: string;
    placement?: "top-left" | "inline";
    theme?: "dark" | "light";
};

export default function AccountMenu({ email, label, placement = "top-left", theme = "dark" }: AccountMenuProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] = useState(false);
    const [countdown, setCountdown] = useState(10);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isOpen) return;

        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape") {
                setIsOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [isOpen]);

    useEffect(() => {
        if (!isDeleteConfirmationOpen || countdown === 0) return;

        const timer = window.setInterval(() => {
            setCountdown((currentCountdown) => Math.max(currentCountdown - 1, 0));
        }, 1000);

        return () => window.clearInterval(timer);
    }, [countdown, isDeleteConfirmationOpen]);

    const openDeleteConfirmation = () => {
        setCountdown(10);
        setIsDeleteConfirmationOpen(true);
    };

    const closeDeleteConfirmation = () => {
        setCountdown(10);
        setIsDeleteConfirmationOpen(false);
    };

    const buttonClass = placement === "inline"
        ? (theme === "light"
            ? "w-full cursor-pointer text-left text-sm text-neutral-900 transition-colors hover:text-black"
            : "w-full cursor-pointer text-left text-sm text-primary transition-colors hover:text-white")
        : (theme === "light"
            ? "max-w-[calc(100vw-2rem)] cursor-pointer rounded-full border border-neutral-300 bg-white px-5 py-2 text-left text-sm text-neutral-900 shadow-sm transition-colors hover:border-neutral-400 hover:bg-neutral-50"
            : "max-w-[calc(100vw-2rem)] cursor-pointer rounded-full border border-primary/35 bg-[#171329]/95 px-5 py-2 text-left text-sm text-primary shadow-[0_0_20px_rgba(130,104,180,0.3)] backdrop-blur-xl transition-colors hover:border-primary/70 hover:bg-[#221c38]");

    const dropdownClass = theme === "light"
        ? `absolute left-0 mt-2 w-72 max-w-[calc(100vw-2rem)] rounded-2xl border border-neutral-200 bg-white p-4 text-neutral-900 shadow-lg ${placement === "inline" ? "bottom-full mb-2 mt-0" : ""}`
        : `absolute left-0 mt-2 w-72 max-w-[calc(100vw-2rem)] rounded-2xl border border-primary/25 bg-[#171329]/95 p-4 text-primary shadow-[0_0_30px_rgba(107,87,155,0.35)] backdrop-blur-xl ${placement === "inline" ? "bottom-full mb-2 mt-0" : ""}`;

    return (
        <>
            <div ref={menuRef} className={`font-outfit ${placement === "top-left" ? "fixed left-4 top-4 z-50" : "relative"}`}>
            <button
                type="button"
                onClick={() => setIsOpen((open) => !open)}
                aria-expanded={isOpen}
                aria-haspopup="true"
                className={buttonClass}
            >
                <span className="block truncate font-semibold">{label ?? email}</span>
                {label && <span className={`mt-1 block truncate text-xs ${theme === "light" ? "text-neutral-500" : "text-primary/50"}`}>{email}</span>}
            </button>

            {isOpen && (
                <div className={dropdownClass}>
                    <p className={`mb-1 break-words text-xs ${theme === "light" ? "text-neutral-500" : "text-primary/60"}`}>Signed in as</p>
                    <p className="mb-4 break-words text-sm font-medium">{email}</p>

                    <div className={`space-y-2 border-t pt-4 ${theme === "light" ? "border-neutral-200" : "border-primary/15"}`}>
                            <form action={logout}>
                                <button
                                    type="submit"
                                    className={theme === "light"
                                        ? "w-full rounded-lg bg-neutral-900 px-3 py-2 text-sm text-white transition-colors hover:bg-neutral-800 cursor-pointer"
                                        : "w-full rounded-lg bg-button px-3 py-2 text-sm text-white transition-colors hover:bg-[#8268B4] cursor-pointer"}
                                >
                                    Log out
                                </button>
                            </form>
                            <button
                                type="button"
                                onClick={openDeleteConfirmation}
                                className={theme === "light"
                                    ? "w-full rounded-lg border border-red-300 px-3 py-2 text-sm text-red-600 transition-colors hover:bg-red-50 cursor-pointer"
                                    : "w-full rounded-lg border border-red-400/40 px-3 py-2 text-sm text-red-300 transition-colors hover:bg-red-950/40 cursor-pointer"}
                            >
                                Delete account
                            </button>
                    </div>
                </div>
            )}
            </div>

            {isDeleteConfirmationOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/65 px-4 font-outfit">
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="delete-account-title"
                        className="w-full max-w-md rounded-2xl border border-red-400/35 bg-[#171329] p-6 text-primary shadow-[0_0_50px_rgba(0,0,0,0.65)]"
                    >
                        <h2 id="delete-account-title" className="mb-4 text-lg font-semibold text-red-300">
                            Delete account?
                        </h2>
                        {countdown > 0 && (
                            <p className="mb-4 text-center text-sm text-primary">
                                Confirmation available in {countdown}s
                            </p>
                        )}
                        <form action={deleteCurrentUser} className="flex gap-2">
                            <button
                                type="button"
                                onClick={closeDeleteConfirmation}
                                className="flex-1 rounded-lg border border-primary/30 px-3 py-2 text-sm text-primary transition-colors hover:bg-primary/10 cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={countdown > 0}
                                className={`flex-1 rounded-lg px-3 py-2 text-sm transition-colors ${
                                    countdown > 0
                                        ? "cursor-not-allowed bg-red-900/40 text-red-200/60"
                                        : "bg-red-700/80 text-white hover:bg-red-600 cursor-pointer"
                                }`}
                            >
                                Delete account
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
