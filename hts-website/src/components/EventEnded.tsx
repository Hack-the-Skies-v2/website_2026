import Link from "next/link";

export default function EventEnded() {
	return (
		<main className="flex min-h-screen items-center justify-center px-6 py-20">
			<div className="text-center">
				<h1 className="font-outfit text-4xl font-semibold text-primary drop-shadow-[0_0_12px_rgba(193,185,242,0.5)] md:text-5xl">
					Portal Closed
				</h1>
				<p className="mt-4 font-outfit text-lg text-primary/80">
					Hack the Skies 2026 is over, come back next year!
				</p>
				<Link
					href="/"
					className="mt-8 inline-flex rounded-full bg-button px-6 py-3 font-outfit text-base text-white shadow-[0_0_20px_rgba(130,104,180,0.45)] transition-all duration-150 hover:scale-[1.02] hover:bg-[#8268B4]"
				>
					Return Home
				</Link>
			</div>
		</main>
	);
}
