"use client";

import Link from "next/link";

export default function OrganizerSignIn() {
  return (
    <div className="flex flex-col items-center gap-3">
      <Link
        href="/auth?next=/organizers"
        className="rounded-full bg-button px-7 py-3 font-outfit text-lg font-medium text-white transition hover:bg-[#8268B4]"
      >
        Continue to portal sign in
      </Link>
      <p className="max-w-sm text-sm text-white/50">
        Sign in with the same account used for the hacker/mentor portal. Admin access is required.
      </p>
    </div>
  );
}
