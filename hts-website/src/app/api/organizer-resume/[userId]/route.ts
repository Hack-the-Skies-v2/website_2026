import { NextResponse } from "next/server";
import { getOrganizer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const USER_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(
  _request: Request,
  context: { params: Promise<{ userId: string }> },
) {
  const organizer = await getOrganizer();
  if (!organizer) {
    return new NextResponse("Sign in as an organizer to view resumes.", { status: 401 });
  }

  const { userId } = await context.params;
  if (!USER_ID.test(userId)) {
    return new NextResponse("Invalid application.", { status: 400 });
  }

  const supabase = await createClient();
  const { data: hacker } = await supabase
    .from("hacker_applications")
    .select("resume_path")
    .eq("user_id", userId)
    .maybeSingle();

  const path =
    typeof hacker?.resume_path === "string" && hacker.resume_path.trim()
      ? hacker.resume_path.trim()
      : `${userId}/resume.pdf`;

  const { data, error } = await supabase.storage.from("resumes").createSignedUrl(path, 60 * 10);
  if (error || !data?.signedUrl) {
    return new NextResponse("This resume is not available yet.", { status: 404 });
  }

  return NextResponse.redirect(data.signedUrl);
}
