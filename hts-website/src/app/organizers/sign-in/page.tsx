import Link from "next/link";
import OrganizerSignIn from "@/components/OrganizerSignIn";

export default function OrganizerSignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; email?: string }>;
}) {
  return (
    <OrganizerSignInGate searchParams={searchParams} />
  );
}

async function OrganizerSignInGate({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; email?: string }>;
}) {
  const params = await searchParams;
  return (
    <main className="min-h-screen px-5 py-16 font-outfit text-primary md:px-10">
      <div className="mx-auto max-w-lg text-center">
        <p className="font-pixel text-sm uppercase tracking-[0.2em] text-star">
          Hack the Skies · private
        </p>
        <h1 className="mt-4 text-4xl font-semibold">Organizer sign in</h1>
        <p className="mt-3 text-white/65">
          Use an admin account from the portal. After you sign in, you will return here to review live applications.
        </p>
        {params.error === "not_admin" ? (
          <p className="mt-4 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
            {params.email
              ? `${params.email} is signed in but is not marked admin in public.users.`
              : "This account is not marked admin."}{" "}
            Ask another admin to set <code className="text-star">admin = true</code> for your user.
          </p>
        ) : null}
        {params.error === "config" ? (
          <p className="mt-4 rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
            Supabase env vars are missing. Check .env.local.
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
