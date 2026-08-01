"use client";

import { useState } from "react";

const faqs = [
	{
		question: "What is Hack the Skies?",
		answer:
			"Hack the Skies is a hackathon founded by high school students, for high school students. Participants build innovative projects while learning from mentors and industry professionals.",
	},
	{
		question: "Who can participate?",
		answer:
			"Hack the Skies is open to high school students of all experience levels. Whether you're new to coding or an experienced developer, everyone is welcome.",
	},
	{
		question: "Do I need a team?",
		answer:
			"You can come with a team or find teammates during the event. We encourage participants to collaborate and meet new people.",
	},
	{
		question: "What can I build?",
		answer:
			"Anything you can imagine! Projects can range from software applications to hardware solutions, AI tools, games, and more.",
	},
	{
		question: "Is there a cost to participate?",
		answer: "Hack the Skies is completely free for all participants.",
	},
	{
		question: "Will there be mentors?",
		answer:
			"Yes! Industry professionals and experienced developers will be available throughout the event to guide participants.",
	},
];

export default function FAQ() {
	const [open, setOpen] = useState<number | null>(null);
	const leftFaqs = faqs.filter((_, i) => i % 2 === 0);
	const rightFaqs = faqs.filter((_, i) => i % 2 === 1);

	return (
		<section
			id="faq"
			className="
                relative
				min-h-screen
				flex
				flex-col
				pt-32
                md:pt-40
                lg:pt-48
				items-center
				px-6
				py-24
			"
		>
			{/* <img
				src="/Planet1.webp"
				alt=""
				className="
                    pointer-events-none
                    absolute
                    left-4
                    top-[48%]
                    w-24
                    md:left-12
                    md:top-[45%]
                    md:w-36
                    lg:left-20
                    lg:top-[50%]
                    lg:w-44
                    opacity-80
                    magenta-planet-glow
                    select-none
                "
			/> */}
			<img
				src="/Planet2.webp"
				alt=""
				className="
                    pointer-events-none
                    absolute
                    right-10
                    bottom-32
                    w-36
                    md:right-20
                    md:w-52
                    lg:right-32
                    lg:w-64
                    opacity-80
                    gold-planet-glow
                    select-none
                "
			/>
			<img
                src="/RandomStars.webp"
                alt=""
                className="
                    pointer-events-none
                    absolute
                    right-[35%]
                    top-24
                    w-28
                    md:w-40
                    lg:w-48
                    opacity-90
                    star-glow
                    select-none
                "
            />
			<h2
				className="
					font-outfit
					text-4xl
					md:text-5xl
					text-primary
					font-semibold
					mb-12
                    md:mb-16
                    lg:mb-20
					drop-shadow-[0_0_12px_rgba(193,185,242,0.5)]
				"
			>
				Frequently Asked Questions
			</h2>

			<div
				className="
                    flex
                    w-full
                    max-w-5xl
                    gap-5
                    flex-col
		            md:flex-row
                "
			>
				<div className="flex flex-1 flex-col gap-5">
					{leftFaqs.map((faq, index) => (
						<FAQCard
							key={index}
							faq={faq}
							index={index * 2}
							open={open}
							setOpen={setOpen}
						/>
					))}
				</div>

				<div className="flex flex-1 flex-col gap-5">
					{rightFaqs.map((faq, index) => (
						<FAQCard
							key={index}
							faq={faq}
							index={index * 2 + 1}
							open={open}
							setOpen={setOpen}
						/>
					))}
				</div>
			</div>
		</section>
	);
}

function FAQCard({
	faq,
	index,
	open,
	setOpen,
}: {
	faq: { question: string; answer: string };
	index: number;
	open: number | null;
	setOpen: (value: number | null) => void;
}) {
	const isOpen = open === index;

	return (
		<div
			className={`
				rounded-2xl
				border
				border-white/20
				bg-white/10
				backdrop-blur-md
				overflow-hidden
				transition-all
				duration-300
				cursor-pointer
				${isOpen ? "shadow-[0_0_25px_rgba(193,185,242,0.25)]" : ""}
			`}
			onClick={() => setOpen(isOpen ? null : index)}
		>
			<div className="flex items-center justify-between p-5">
				<h3 className="font-outfit text-lg md:text-xl text-primary text-left">
					{faq.question}
				</h3>

				<div
					className={`
                        flex
                        h-8
                        w-8
                        items-center
                        justify-center
                        text-primary
                        transition-transform
                        duration-300
                        ${isOpen ? "rotate-180" : ""}
                    `}
				>
					<svg
						className="h-5 w-5"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2.5"
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<path d="M6 9l6 6 6-6" />
					</svg>
				</div>
			</div>

			<div
				className={`
					grid
					transition-all
					duration-300
					${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}
				`}
			>
				<div className="overflow-hidden">
					<p className="px-5 pb-5 font-outfit text-sm md:text-base text-primary/80 text-left leading-relaxed">
						{faq.answer}
					</p>
				</div>
			</div>
		</div>
	);
}
