import Link from "next/link";
import { redirect } from "next/navigation";
import OrganizerSignIn from "@/components/OrganizerSignIn";
import { getOrganizer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default function OrganizerSignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; email?: string }>;
}) {
  return <OrganizerSignInGate searchParams={searchParams} />;
}

async function OrganizerSignInGate({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; email?: string }>;
}) {
  const params = await searchParams;
  const organizer = await getOrganizer();
  if (organizer) {
    redirect("/organizers");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="min-h-screen px-5 py-16 font-outfit text-primary md:px-10">
      <div className="mx-auto max-w-lg text-center">
        <p className="font-pixel text-sm uppercase tracking-[0.2em] text-star">
          Hack the Skies · private
        </p>
        <h1 className="mt-4 text-4xl font-semibold">Organizer sign in</h1>
        <p className="mt-3 text-white/65">
          Sign in with an admin portal account to open the organizer console.
        </p>
        {params.error === "not_admin" || (user && !organizer) ? (
          <p className="mt-4 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
            {(params.email || user?.email) ?? "This account"} is signed in but not
            marked admin. In Supabase SQL run:
            <code className="mt-2 block text-left text-star">
              update public.users set admin = true where id = &apos;{user?.id ?? "YOUR_USER_UUID"}&apos;;
            </code>
          </p>
        ) : null}
        {params.error === "config" ? (
          <p className="mt-4 rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
            Supabase env vars are missing. Check deployment configuration.
          </p>
        ) : null}
        <div className="mt-8">
          <OrganizerSignIn />
        </div>
        <Link href="/" className="mt-8 inline-block text-sm text-primary/80 hover:underline">
          Back to public site
        </Link>
      </div>
    </main>
  );
}
