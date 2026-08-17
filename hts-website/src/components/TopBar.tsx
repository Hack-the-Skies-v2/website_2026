"use client";

import { useEffect, useState } from "react";

const NAV_ITEMS = [
	{ id: "home", label: "Home" },
	{ id: "join", label: "Join Us" },
	{ id: "faq", label: "FAQ" },
	{ id: "team", label: "Meet the Team" },
	{ id: "contact", label: "Contact Us" },
	{ id: "downloads", label: "Resources" },
];

export default function TopBar() {
	const [active, setActive] = useState("home");
	const [isOpen, setIsOpen] = useState(false);

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

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") setIsOpen(false);
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, []);

	return (
		<header className="fixed top-0 left-0 z-50 w-full px-4 py-3 md:py-6">
			{/* Desktop Navigation - Floating Pill Menu */}
			<div className="hidden md:flex justify-center w-full">
				<nav
					className="
						flex items-center gap-6 md:gap-10
						rounded-full
						bg-white/10
						px-6 py-3
						backdrop-blur-md
						border border-white/20
						shadow-[0_4px_20px_rgba(0,0,0,0.3)]
					"
				>
					{NAV_ITEMS.map((item) => (
						<NavItem key={item.id} id={item.id} active={active}>
							{item.label}
						</NavItem>
					))}
				</nav>
			</div>

			{/* Mobile Header Bar */}
			<div className="flex md:hidden items-center justify-between w-full max-w-md mx-auto rounded-full bg-[#141123]/85 backdrop-blur-md border border-white/20 px-4 py-2.5 shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
				{/* Logo / Brand Name */}
				<a
					href="#home"
					onClick={() => setIsOpen(false)}
					className="flex items-center gap-2 font-outfit text-base font-bold text-primary tracking-wide select-none drop-shadow-[0_0_10px_rgba(193,185,242,0.5)]"
				>
					<img
						src="/favicon.ico"
						alt=""
						className="h-6 w-6 object-contain"
					/>
					<span>Hack the Skies</span>
				</a>

				{/* Hamburger Button */}
				<button
					type="button"
					onClick={() => setIsOpen((prev) => !prev)}
					aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
					aria-expanded={isOpen}
					className="
						relative flex h-9 w-9 items-center justify-center p-1
						text-primary transition duration-200 hover:opacity-80 active:scale-95
						focus:outline-none
					"
				>
					<div className="flex flex-col items-center justify-center w-4 h-4 gap-1">
						<span
							className={`h-0.5 w-4 bg-current rounded-full transition-all duration-300 transform ${isOpen ? "rotate-45 translate-y-1.5" : ""
								}`}
						/>
						<span
							className={`h-0.5 w-4 bg-current rounded-full transition-all duration-300 ${isOpen ? "opacity-0 scale-x-0" : "opacity-100"
								}`}
						/>
						<span
							className={`h-0.5 w-4 bg-current rounded-full transition-all duration-300 transform ${isOpen ? "-rotate-45 -translate-y-1.5" : ""
								}`}
						/>
					</div>
				</button>
			</div>

			{/* Mobile Dropdown Navigation Menu */}
			<div
				className={`
					md:hidden fixed inset-x-4 top-16 z-40 max-w-md mx-auto
					transition-all duration-300 ease-out origin-top
					${isOpen
						? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
						: "opacity-0 scale-95 -translate-y-4 pointer-events-none"
					}
				`}
			>
				<nav className="flex flex-col gap-1 rounded-2xl bg-[#141123]/95 backdrop-blur-md border border-white/20 p-3 shadow-xl">
					{NAV_ITEMS.map((item) => {
						const isActive = active === item.id;
						return (
							<a
								key={item.id}
								href={`#${item.id}`}
								onClick={() => setIsOpen(false)}
								className={`
									rounded-xl px-4 py-2.5
									font-outfit text-base font-medium transition-all duration-200
									${isActive
										? "bg-white/10 text-white"
										: "text-primary hover:bg-white/5 hover:text-white"
									}
								`}
							>
								{item.label}
							</a>
						);
					})}
				</nav>
			</div>
		</header>
	);
}

function NavItem({
	id,
	active,
	children,
	onClick,
}: {
	id: string;
	active: string;
	children: React.ReactNode;
	onClick?: () => void;
}) {
	return (
		<a
			href={`#${id}`}
			onClick={onClick}
			className={`
				font-outfit
				text-sm md:text-base
				transition duration-300
				cursor-pointer
				${active === id
					? "text-white after:block after:h-0.5 after:bg-primary after:rounded-full after:mt-1"
					: "text-primary hover:opacity-70"
				}
			`}
		>
			{children}
		</a>
	);
}

