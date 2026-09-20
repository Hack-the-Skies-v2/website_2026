import "server-only";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type Organizer = {
  id: string;
  email: string;
};

/**
 * The allowlist is the authorization boundary. An email domain is only a
 * convenience for Google sign-in and must never be treated as a role.
 */
export async function getOrganizer(): Promise<Organizer | null> {
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !supabaseKey) {
    return null;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) return null;

  const { data: organizer } = await supabase
    .from("organizers")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  return organizer ? { id: user.id, email: user.email } : null;
}

export async function requireOrganizer(): Promise<Organizer> {
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !supabaseKey) {
    redirect("/organizers/sign-in?error=config");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    redirect("/organizers/sign-in");
  }

  const { data: organizer } = await supabase
    .from("organizers")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!organizer) {
    redirect(`/organizers/sign-in?error=not_allowed&email=${encodeURIComponent(user.email)}`);
  }

  return { id: user.id, email: user.email };
}
