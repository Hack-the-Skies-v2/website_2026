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
            <p>Get out</p>
        </main>
    );
}
