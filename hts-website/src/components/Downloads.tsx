const files = [
	{
		title: "Sponsor Prospectus",
		description:
			"A snapshot of our mission, programs, and partnership opportunities for sponsors and supporters.",
		href: "/downloads/sponsor-prospectus.pdf",
	},
	{
		title: "Annual Report",
		description:
			"Highlights from the past year, including impact, milestones, and the communities we served.",
		href: "/downloads/annual-report.pdf",
	},
] as const;

export default function Downloads() {
	return (
		<section id="downloads" className="relative px-6 py-20 md:px-10 md:py-24">
			<div className="mx-auto max-w-5xl">
				<div className="mb-8 max-w-2xl">
					<h2 className="font-outfit text-3xl font-semibold text-primary drop-shadow-[0_0_12px_rgba(193,185,242,0.5)] md:text-4xl">
						Download the latest updates
					</h2>
					<p className="mt-4 font-outfit text-base leading-relaxed text-primary/80 md:text-lg">
						For sponsors, partners, and supporters, these materials offer a quick look at who we are and what we’re building.
					</p>
				</div>

				<div className="grid gap-5 md:grid-cols-2">
					{files.map((file) => (
						<a
							key={file.title}
							href={file.href}
							download
							className="group flex min-h-[170px] flex-col rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/25"
						>
							<h3 className="font-outfit text-xl font-medium text-primary md:text-2xl">
								{file.title}
							</h3>
							<p className="mt-3 flex-1 font-outfit text-sm leading-relaxed text-primary/75 md:text-base">
								{file.description}
							</p>

							<div className="mt-5 flex items-center justify-between border-t border-white/10 pt-3 font-outfit text-sm font-medium text-primary">
								<span>Download</span>
								<span aria-hidden className="text-lg transition-transform duration-200 group-hover:translate-x-1">
									→
								</span>
							</div>
						</a>
					))}
				</div>
			</div>
		</section>
	);
}
