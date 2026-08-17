import Link from "next/link";

export default function NotFound() {
	return (
		<main className="flex min-h-screen items-center justify-center px-6 py-20">
			<div className="text-center">
				<h1 className="mt-4 font-outfit text-4xl font-semibold text-primary drop-shadow-[0_0_12px_rgba(193,185,242,0.5)] md:text-5xl">
					Page Not Found
				</h1>
				<p className="mt-4 max-w-xl font-outfit text-base leading-relaxed text-primary/80 md:text-lg">
					The page you were looking for doesn’t seem to be here.
				</p>
				<div className="mt-8">
					<Link
						href="/"
						className="inline-flex rounded-full bg-button px-6 py-3 font-outfit text-base text-white shadow-[0_0_20px_rgba(130,104,180,0.45)] transition-all duration-150 hover:bg-[#8268B4] hover:scale-[1.02]"
					>
						Return Home
					</Link>
				</div>
			</div>
		</main>
	);
}
