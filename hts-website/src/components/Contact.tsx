import ParallaxLayer from "@/components/ParallaxLayer";

export default function Contact() {
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
				<p className="font-outfit text-base md:text-lg text-primary/80">
					The contact form is unavailable right now. Please email us instead at{" "}
					<a
						href="mailto:hello@hacktheskies.com"
						className="text-white underline underline-offset-4 transition-colors duration-150 hover:text-primary"
					>
						hello@hacktheskies.com
					</a>
					.
				</p>
			</div>
		</section>
	);
}
