import Link from "next/link";
import OrganizerSignIn from "@/components/OrganizerSignIn";

type PageProps = {
  searchParams: Promise<{
    error?: string;
    email?: string;
  }>;
};

export default async function OrganizerSignInPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const error = params?.error;
  const email = params?.email;

  let errorMessage: string | null = null;
  if (error === "auth") {
    errorMessage = "Sign-in was cancelled or could not be completed. Please try again.";
  } else if (error === "config") {
    errorMessage = "Supabase configuration is missing in environment variables.";
  } else if (error === "not_allowed") {
    errorMessage = email
      ? `Signed in as ${email}, but this account is not in the organizer allowlist. Add your email to the organizer_allowlist table in Supabase to gain access.`
      : "Your account is not in the organizer allowlist. Add your email to the organizer_allowlist table in Supabase to gain access.";
  } else if (error) {
    errorMessage = decodeURIComponent(error);
  }

  return (
    <main className="grid min-h-screen place-items-center px-6">
      <section className="max-w-xl rounded-3xl border border-primary/40 bg-[#201b38]/95 p-10 text-center shadow-[0_0_42px_rgba(193,185,242,0.2)]">
        <p className="font-pixel text-sm uppercase tracking-[0.25em] text-star">Hack the Skies</p>
        <h1 className="mt-4 font-outfit text-4xl font-semibold text-primary">Organizer console</h1>
        <p className="my-5 font-outfit text-lg leading-relaxed text-white/75">
          Sign in with an invited organizer account to review applications and send decisions.
        </p>

        {errorMessage && (
          <div className="mb-6 rounded-2xl border border-red-500/40 bg-red-950/40 p-4 text-left text-sm text-red-200">
            <p className="font-medium text-red-100">Access Restricted</p>
            <p className="mt-1 leading-relaxed text-red-200/90">{errorMessage}</p>
          </div>
        )}

        <OrganizerSignIn />

        <p className="mt-6 text-sm text-white/55">
          Access is granted only to email addresses added to the organizer allowlist.
        </p>
        <Link href="/" className="mt-8 inline-block text-sm text-primary underline underline-offset-4">
          Back to the website
        </Link>
      </section>
    </main>
  );
}
