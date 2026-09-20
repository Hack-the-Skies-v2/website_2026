import "server-only";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type Organizer = {
  id: string;
  email: string;
};

/** Organizer console uses the existing admin flag on public.users. */
export async function getOrganizer(): Promise<Organizer | null> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    return null;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return null;

  const { data: profile } = await supabase
    .from("users")
    .select("id, admin")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.admin) return null;
  return { id: user.id, email: user.email };
}

export async function requireOrganizer(): Promise<Organizer> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    redirect("/auth?next=/organizers&error=config");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    redirect("/auth?next=/organizers");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("id, admin")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.admin) {
    redirect(`/auth?next=/organizers&error=not_admin&email=${encodeURIComponent(user.email)}`);
  }

  return { id: user.id, email: user.email };
}
