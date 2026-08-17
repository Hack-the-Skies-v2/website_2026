"use client";

import { useEffect, useState } from "react";

export default function TopBar() {
	const [active, setActive] = useState("home");

	useEffect(() => {
		const sections = document.querySelectorAll("section[id]");

		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						setActive(entry.target.id);
					}
				});
			},
			{
				threshold: 0.5,
			},
		);

		sections.forEach((section) => observer.observe(section));

		return () => observer.disconnect();
	}, []);

	return (
		<nav className="fixed top-0 left-0 z-50 flex w-full justify-center px-4 py-4 md:py-6">
			<div
				className="
					flex items-center gap-6 md:gap-10
					rounded-full
					bg-white/10
					px-6 py-3
					backdrop-blur-md
					border border-white/20
				"
			>
				<NavItem id="home" active={active}>
					Home
				</NavItem>

				<NavItem id="join" active={active}>
					Join Us
				</NavItem>

				<NavItem id="faq" active={active}>
					FAQ
				</NavItem>

				<NavItem id="team" active={active}>
					Meet the Team
				</NavItem>

				<NavItem id="contact" active={active}>
					Contact Us
				</NavItem>

				<NavItem id="downloads" active={active}>
					Resources
				</NavItem>
			</div>
		</nav>
	);
}

function NavItem({
	id,
	active,
	children,
}: {
	id: string;
	active: string;
	children: React.ReactNode;
}) {
	return (
		<a
			href={`#${id}`}
			className={`
				font-outfit
				text-sm md:text-base
				transition duration-300
				cursor-pointer
				${
					active === id
						? "text-white after:block after:h-0.5 after:bg-primary after:rounded-full after:mt-1"
						: "text-primary hover:opacity-70"
				}
			`}
		>
			{children}
		</a>
	);
}
