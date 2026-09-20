import Link from "next/link";
import EmailTestForm from "@/components/EmailTestForm";

export default function EmailTestPage() {
  return (
    <main className="min-h-screen px-5 py-10 font-outfit text-primary md:px-10">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/organizers/preview"
          className="text-sm text-primary hover:underline"
        >
          ← Back to mock list
        </Link>
        <h1 className="mt-4 text-3xl font-semibold text-white">Decision email test</h1>
        <p className="mt-2 max-w-xl text-white/65">
          Sends the same accept/reject templates used by the organizer console.
          Enter any inbox, pick acceptance or rejection, then send. Nothing is hardcoded.
        </p>
        <div className="mt-8">
          <EmailTestForm />
        </div>
      </div>
    </main>
  );
}
