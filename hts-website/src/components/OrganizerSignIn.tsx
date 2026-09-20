"use client";

import Link from "next/link";

export default function OrganizerSignIn() {
  return (
    <div className="flex flex-col items-center gap-3">
      <Link
        href="/auth?next=/organizers"
        className="rounded-full bg-button px-7 py-3 font-outfit text-lg font-medium text-white transition-colors hover:bg-[#8268B4]"
      >
        Sign in to organizer console
      </Link>
      <p className="max-w-sm text-sm text-white/50">
        After Google or email sign-in you will be sent to /organizers.
      </p>
    </div>
  );
}
