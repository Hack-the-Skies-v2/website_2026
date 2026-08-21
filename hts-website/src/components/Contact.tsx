"use client";

import ParallaxLayer from "@/components/ParallaxLayer";
import { submitContactForm } from "@/actions/submitContactForm";
import { useState, useRef, useEffect } from "react";

export default function Contact() {
	const [notification, setNotification] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const timerRef = useRef<NodeJS.Timeout | null>(null);

	useEffect(() => {
		if (notification) {
			if (timerRef.current) {
				clearTimeout(timerRef.current);
			}
			timerRef.current = setTimeout(() => {
				setNotification(null);
			}, 5000);
		}

		return () => {
			if (timerRef.current) {
				clearTimeout(timerRef.current);
			}
		};
	}, [notification]);

	async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (isSubmitting) return;

		setIsSubmitting(true);
		setNotification(null);

		const form = event.currentTarget;
		const formData = new FormData(form);

		const email = (formData.get("email") as string) || "";
		const message = (formData.get("message") as string) || "";
		const website = (formData.get("website") as string) || "";

		try {
			const result = await submitContactForm(email, message, website);

			if (result.success) {
				setNotification("Message sent successfully!");
				form.reset();
			} else {
				setNotification(result.error ?? "Something went wrong. Please try again.");
			}
		} catch {
			setNotification("Unable to send message. Please try again.");
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<section
			id="contact"
			className="
				min-h-[72vh]
				flex
				items-center
				justify-center
				px-6
				py-16
				relative
			"
		>
			<ParallaxLayer
				speed={0.4}
				className="
					pointer-events-none
					absolute
					top-[-100px]
					left-1/2
					w-[1000px]
					-translate-x-1/2
					opacity-35
					blur-[1px]
					cloud-drift
					select-none
				"
			>
				<img src="/Cloud1.webp" alt="" className="h-full w-full" />
			</ParallaxLayer>
			<div
				className="
					w-full
					max-w-4xl
					rounded-3xl
					border
					border-white/20
					bg-white/10
					backdrop-blur-md
					p-8
					md:p-12
					shadow-[0_0_35px_rgba(193,185,242,0.18)]
				"
			>
				<h2
					className="
						font-outfit
						text-4xl
						md:text-5xl
						font-semibold
						text-primary
						drop-shadow-[0_0_12px_rgba(193,185,242,0.5)]
						mb-3
					"
				>
					Contact Us
				</h2>
				<p className="font-outfit text-base md:text-lg text-primary/80 mb-8">
					Send us a message below, or you can email us at{" "}
					<a
						href="mailto:hello@hacktheskies.com"
						className="text-white underline underline-offset-4 transition-colors duration-150 hover:text-primary"
					>
						hello@hacktheskies.com
					</a>
					.
				</p>

				<form onSubmit={handleSubmit} className="flex flex-col gap-6">
					<input
						type="email"
						name="email"
						placeholder="Email"
						required
						className="
							w-full
							rounded-xl
							bg-[#8270B8]/35
							border
							border-white/15
							px-5
							py-4
							font-outfit
							text-primary
							placeholder:text-primary/60
							outline-none
							transition-all
							duration-200
							focus:border-primary
							focus:bg-[#8270B8]/45
							focus:shadow-[0_0_18px_rgba(193,185,242,0.25)]
						"
					/>

					<textarea
						rows={10}
						placeholder="Message"
						name="message"
						required
						className="
							w-full
							resize-none
							rounded-xl
							bg-[#8270B8]/35
							border
							border-white/15
							px-5
							py-4
							font-outfit
							text-primary
							placeholder:text-primary/60
							outline-none
							transition-all
							duration-200
							focus:border-primary
							focus:bg-[#8270B8]/45
							focus:shadow-[0_0_18px_rgba(193,185,242,0.25)]
						"
					/>
					<input
						type="text"
						name="website"
						tabIndex={-1}
						autoComplete="off"
						className="hidden"
					/>

					<div className="flex justify-end">
						<button
							type="submit"
							disabled={isSubmitting}
							className="
								inline-flex
								items-center
								justify-center
								gap-2.5
								rounded-full
								bg-button
								px-8
								py-3
								font-outfit
								text-white
								transition-all
								duration-150
								cursor-pointer
								shadow-[0_0_20px_rgba(130,104,180,0.45)]
								hover:bg-[#8268B4]
								hover:scale-105
								active:scale-95
								disabled:opacity-60
								disabled:cursor-not-allowed
								disabled:hover:scale-100
								disabled:hover:bg-button
							"
						>
							{isSubmitting ? (
								<>
									<svg
										className="h-4 w-4 animate-spin text-white"
										xmlns="http://www.w3.org/2000/svg"
										fill="none"
										viewBox="0 0 24 24"
									>
										<circle
											className="opacity-25"
											cx="12"
											cy="12"
											r="10"
											stroke="currentColor"
											strokeWidth="4"
										/>
										<path
											className="opacity-75"
											fill="currentColor"
											d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
										/>
									</svg>
									<span>Sending...</span>
								</>
							) : (
								<span>Send Message</span>
							)}
						</button>
					</div>
				</form>
			</div>

			{notification && (
				<aside
					role="status"
					aria-live="polite"
					aria-atomic="true"
					className="
						fixed
						bottom-6
						sm:bottom-8
						inset-x-0
						z-50
						pointer-events-none
						flex
						justify-center
						px-4
					"
				>
					<div
						className="
							pointer-events-auto
							toast-slide-up
							flex
							items-center
							justify-between
							gap-4
							w-full
							max-w-md
							rounded-2xl
							border
							border-white/20
							bg-[#1a1530]/90
							backdrop-blur-md
							px-6
							py-4
							shadow-[0_0_35px_rgba(193,185,242,0.22)]
						"
					>
						<p className="font-outfit text-sm md:text-base text-primary leading-relaxed">
							{notification}
						</p>

						<button
							type="button"
							onClick={() => setNotification(null)}
							aria-label="Close notification"
							className="
								-mr-1
								shrink-0
								cursor-pointer
								rounded-lg
								p-1.5
								text-primary/60
								transition-colors
								duration-150
								hover:bg-white/10
								hover:text-primary
								focus:outline-none
							"
						>
							<svg
								className="h-4 w-4"
								viewBox="0 0 20 20"
								fill="currentColor"
								aria-hidden="true"
							>
								<path
									fillRule="evenodd"
									d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
									clipRule="evenodd"
								/>
							</svg>
						</button>
					</div>
				</aside>
			)}
		</section>
	);
}
