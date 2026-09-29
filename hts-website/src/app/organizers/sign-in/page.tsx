import { redirect } from "next/navigation";
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
    await searchParams;
    const organizer = await getOrganizer();
    if (organizer) {
        redirect("/organizers");
    }

    const supabase = await createClient();
    await supabase.auth.getUser();

    return (
        <main className="min-h-screen bg-white px-6 py-16 font-sans text-neutral-600 md:px-12">
            <p>Access restricted.</p>
        </main>
    );
}
