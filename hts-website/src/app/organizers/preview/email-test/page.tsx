import Link from "next/link";
import EmailTestForm from "@/components/EmailTestForm";

export default function EmailTestPage() {
  return (
    <main className="min-h-screen bg-white px-6 py-10 font-sans text-neutral-900 md:px-12">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/organizers/preview"
          className="text-sm text-neutral-500 hover:text-neutral-900 hover:underline"
        >
          ← Back to mock list
        </Link>
        <h1 className="mt-4 text-2xl font-semibold text-neutral-900">Decision email test</h1>
        <p className="mt-2 text-sm text-neutral-500">
          Sends the same accept/reject templates used by the organizer console.
          Enter any inbox, pick acceptance or rejection, then send.
        </p>
        <div className="mt-8">
          <EmailTestForm />
        </div>
      </div>
    </main>
  );
}
