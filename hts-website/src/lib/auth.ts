import "server-only";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type Organizer = {
  id: string;
  email: string;
};

/** Organizer console access is controlled by the normalized email allowlist. */
export async function getOrganizer(): Promise<Organizer | null> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    return null;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return null;

  const { data: organizer } = await supabase
    .from("organizer_allowlist")
    .select("email")
    .ilike("email", user.email.trim())
    .maybeSingle();

  if (!organizer) return null;
  return { id: user.id, email: user.email };
}

export async function requireOrganizer(): Promise<Organizer> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    redirect("/organizers/sign-in?error=config");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    redirect("/auth?next=/organizers");
  }

  const { data: organizer } = await supabase
    .from("organizer_allowlist")
    .select("email")
    .ilike("email", user.email.trim())
    .maybeSingle();

  if (!organizer) {
    redirect(
      `/organizers/sign-in?error=not_allowlisted&email=${encodeURIComponent(user.email)}`,
    );
  }

  return { id: user.id, email: user.email };
}
