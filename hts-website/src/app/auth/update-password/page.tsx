"use client";

import Link from "next/link";
import { useState, type SubmitEvent } from "react";
import ParallaxLayer from "@/components/ParallaxLayer";
import { updatePassword } from "@/actions/auth";

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const result = await updatePassword(password, confirmPassword);
      setMessage(
        result.success
          ? "Your password has been updated successfully."
          : result.error,
      );
    } catch {
      setMessage("Unable to update your password.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-16">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <ParallaxLayer
          speed={0.2}
          className="absolute right-[-2rem] top-16 w-56 rotate-12 opacity-75 md:right-10 md:w-80"
        >
          <img src="/Constellation.png" alt="" className="h-full w-full" />
        </ParallaxLayer>
        <ParallaxLayer
          speed={0.12}
          className="absolute left-1/2 top-[-80px] w-[850px] -translate-x-1/2 opacity-20"
        >
          <img src="/Cloud1.webp" alt="" className="h-full w-full" />
        </ParallaxLayer>
      </div>

      <section className="relative z-10 w-full max-w-md rounded-3xl border border-primary/25 bg-[#171329]/90 p-6 shadow-[0_0_50px_rgba(107,87,155,0.25)] backdrop-blur-xl sm:p-8">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-3">
            <img
              src="/favicon.ico"
              alt="Hack the Skies Logo"
              className="h-10 w-10 object-contain drop-shadow-[0_0_15px_rgba(193,185,242,0.5)]"
            />
            <span className="font-outfit text-2xl font-bold text-primary">
              Hack the Skies
            </span>
          </Link>
          <h1 className="mt-8 font-outfit text-2xl font-bold text-primary">
            Set a new password
          </h1>
          <p className="mt-2 font-outfit text-sm leading-relaxed text-primary/70">
            Choose a new password for your account.
          </p>
        </div>

        {message && (
          <p className="mb-5 rounded-xl border border-primary/30 bg-[#221c38]/80 p-3 font-outfit text-sm leading-relaxed text-primary">
            {message}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="new-password"
              className="mb-1.5 block font-outfit text-sm font-medium text-primary"
            >
              New password
            </label>
            <input
              id="new-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border border-primary/40 bg-[#221c38]/90 px-4 py-3 font-outfit text-base text-white focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label
              htmlFor="confirm-password"
              className="mb-1.5 block font-outfit text-sm font-medium text-primary"
            >
              Confirm new password
            </label>
            <input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="w-full rounded-xl border border-primary/40 bg-[#221c38]/90 px-4 py-3 font-outfit text-base text-white focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-xl bg-button px-6 py-3.5 font-outfit text-base font-semibold text-white shadow-[0_0_20px_rgba(130,104,180,0.45)] transition hover:bg-[#8268B4]"
          >
            {isLoading ? "Updating password..." : "Update password"}
          </button>
        </form>

        <Link
          href="/auth"
          className="mt-5 block text-center font-outfit text-sm text-primary/70 transition hover:text-primary"
        >
          Back to sign in
        </Link>
      </section>
    </main>
  );
}
