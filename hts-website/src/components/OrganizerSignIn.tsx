"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function OrganizerSignIn() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signIn() {
    setPending(true);
    setError(null);
    try {
      const domain = process.env.NEXT_PUBLIC_ORGANIZER_EMAIL_DOMAIN;
      const supabase = createClient();
      const { data, error: signInError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/organizers`,
          queryParams: domain ? { hd: domain } : undefined,
        },
      });

      if (signInError) {
        setError(signInError.message || "Google sign-in could not start. Please try again.");
        setPending(false);
      } else if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Google sign-in could not start. Please try again.";
      setError(msg);
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {error && (
        <div className="max-w-md rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-200">
          {error}
        </div>
      )}
      <button
        type="button"
        onClick={signIn}
        disabled={pending}
        className="rounded-full bg-button px-7 py-3 font-outfit text-lg font-medium text-white transition hover:bg-[#8268B4] disabled:cursor-wait disabled:opacity-70"
      >
        {pending ? "Redirecting to Google…" : "Continue with Google"}
      </button>
    </div>
  );
}
