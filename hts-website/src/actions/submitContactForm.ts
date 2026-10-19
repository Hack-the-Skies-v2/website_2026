"use server";

export async function submitContactForm(
	_email: string,
	_message: string,
	_website: string,
) {
	return {
		success: false,
		error: "The contact form is unavailable right now. Please email us instead.",
	};
}
