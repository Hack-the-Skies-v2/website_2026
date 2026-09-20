"use server";

import { createClient } from "@/lib/supabase/server";

const RESUME_BUCKET = "resumes";
const MAX_RESUME_BYTES = 4 * 1024 * 1024;

type UploadResult =
	| { success: true; path: string; name: string }
	| { success: false; error: string };

type RemoveResult = { success: true } | { success: false; error: string };

export async function uploadHackerResume(formData: FormData): Promise<UploadResult> {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return { success: false, error: "You must be signed in." };
	}

	const file = formData.get("resume");

	if (!(file instanceof File) || file.size === 0) {
		return { success: false, error: "Please choose a PDF to upload." };
	}

	if (file.size > MAX_RESUME_BYTES) {
		return { success: false, error: "Your resume must be 4 MB or smaller." };
	}

	const header = await file.slice(0, 5).text();
	if (header !== "%PDF-") {
		return { success: false, error: "Please upload a PDF file." };
	}

	const path = `${user.id}/resume.pdf`;
	const { error } = await supabase.storage
		.from(RESUME_BUCKET)
		.upload(path, file, { contentType: "application/pdf", upsert: true });

	if (error) {
		return { success: false, error: "Unable to upload your resume right now." };
	}

	const name = file.name.replace(/<[^>]*>/g, "").trim().slice(0, 200) || "resume.pdf";

	return { success: true, path, name };
}

export async function removeHackerResume(): Promise<RemoveResult> {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return { success: false, error: "You must be signed in." };
	}

	const { error } = await supabase.storage
		.from(RESUME_BUCKET)
		.remove([`${user.id}/resume.pdf`]);

	if (error) {
		return { success: false, error: "Unable to remove your resume right now." };
	}

	return { success: true };
}