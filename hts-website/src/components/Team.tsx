"use client";

import ParallaxLayer from "@/components/ParallaxLayer";
import { useCallback, useEffect, useRef, useState } from "react";
const TEAM = [
	{
		name: "Gloria Baril",
		role: "Chair",
		pronouns: "She/her",
		src: "/team/members/gloria-baril.png",
		rotate: -4,
		hang: 28,
	},
	{
		name: "Arv Das",
		role: "Vice Chair",
		pronouns: "He/Him",
		src: "/team/members/arv-das.jpeg",
		rotate: 3,
		hang: 48,
	},
	{
		name: "Leo Tang",
		role: "DevOps",
		pronouns: "He/him",
		src: "/team/members/leo-tang.jpeg",
		rotate: -2,
		hang: 22,
	},
	{
		name: "Muhammad Ali Hashar",
		role: "DevOps",
		pronouns: "he/him",
		src: "/team/members/muhammad-ali-hashar.png",
		rotate: 5,
		hang: 56,
	},
	{
		name: "Preston Chan",
		role: "Board Secretary",
		pronouns: "He/Him",
		src: "/team/members/preston-chan.jpeg",
		rotate: -3,
		hang: 34,
	},
	{
		name: "Saanvi Bhatia",
		role: "Logistics Head",
		pronouns: "She/her",
		src: "/team/members/saanvi-bhatia.jpg",
		rotate: 2,
		hang: 42,
	},
	{
		name: "Devraj Roy",
		role: "Communications Lead",
		pronouns: "He/him",
		src: "/team/members/devraj-roy.jpeg",
		rotate: -5,
		hang: 30,
	},
	{
		name: "Arnav Govil",
		role: "Logistics",
		pronouns: "He/Him",
		src: "/team/members/arnav-govil.jpg",
		rotate: 4,
		hang: 50,
	},
	{
		name: "Prithiga Ravichandran",
		role: "Logistics",
		pronouns: "She/Her",
		src: "/team/members/prithiga-ravichandran.jpg",
		rotate: -2,
		hang: 26,
	},
	{
		name: "Charvi Patnala",
		role: "Logistics",
		pronouns: "She/Her",
		src: "/team/members/charvi-patnala.jpg",
		rotate: 3,
		hang: 44,
	},
	{
		name: "Rizheen Rahman",
		role: "Marketing",
		pronouns: "she/her",
		src: "/team/members/rizheen-rahman.jpeg",
		rotate: -4,
		hang: 36,
	},
	{
		name: "Dasha Turetska",
		role: "Marketing",
		pronouns: "She/her",
		src: "/team/members/dasha-turetska.jpg",
		rotate: 2,
		hang: 52,
	},
	{
		name: "Meagan Tsai",
		role: "Marketing",
		pronouns: "She/Her",
		src: "/team/members/meagan-tsai.jpeg",
		rotate: -3,
		hang: 24,
	},
	{
		name: "Alfi Islam",
		role: "Communications",
		pronouns: "He/Him",
		src: "/team/members/alfi-islam.jpeg",
		rotate: 5,
		hang: 40,
	},
	{
		name: "Ryan Ahmed",
		role: "Communications",
		pronouns: "he/him",
		src: "/team/members/ryan-ahmed.jpg",
		rotate: -2,
		hang: 46,
	},
	{
		name: "Fateen Tahmeed",
		role: "Communications",
		pronouns: "He/him",
		src: "/team/members/fateen-tahmeed.jpeg",
		rotate: 3,
		hang: 32,
	},
	{
		name: "Jimmy Minakakis",
		role: "Outreach",
		pronouns: "he/him",
		src: "/team/members/jimmy-minakakis.jpeg",
		rotate: -4,
		hang: 38,
	},
] as const;

function SoftCloud({
	className,
	speed = 0.12,
}: {
	className?: string;
	speed?: number;
}) {
	return (
		<ParallaxLayer
			className={`pointer-events-none absolute ${className ?? ""}`}
			speed={speed}
			aria-hidden
		>
			<svg viewBox="0 0 200 100" className="h-full w-full opacity-55">
				<circle cx="40" cy="55" r="28" fill="white" />
				<circle cx="75" cy="40" r="34" fill="white" />
				<circle cx="115" cy="48" r="30" fill="white" />
				<circle cx="150" cy="58" r="24" fill="white" />
				<circle cx="95" cy="65" r="26" fill="white" />
			</svg>
		</ParallaxLayer>
	);
}

function Rocket({ className }: { className?: string }) {
	return (
		<svg viewBox="0 0 64 64" className={className} aria-hidden>
			<path
				d="M32 4c8 10 12 24 12 36 0 4-2 8-4 10l-8 8-8-8c-2-2-4-6-4-10 0-12 4-26 12-36z"
				fill="#c4b48a"
			/>
			<path d="M24 42l-10 4 6-12z" fill="#8a9aab" />
			<path d="M40 42l10 4-6-12z" fill="#8a9aab" />
			<path d="M28 54l4 8 4-8z" fill="#e8a040" />
			<circle cx="32" cy="28" r="6" fill="#3d4a2e" />
			<path
				d="M29 26l3-4 3 4-3 5z"
				fill="#d4af37"
				stroke="#b8860b"
				strokeWidth="0.5"
			/>
		</svg>
	);
}

export default function Team() {
	const sectionRef = useRef<HTMLElement>(null);
	const viewportRef = useRef<HTMLDivElement>(null);
	const stripRef = useRef<HTMLDivElement>(null);
	const [offset, setOffset] = useState(0);
	const [maxOffset, setMaxOffset] = useState(0);
	const dragRef = useRef<{ active: boolean; startX: number; startOffset: number }>({
		active: false,
		startX: 0,
		startOffset: 0,
	});
	const pausedRef = useRef(false);
	const pauseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const directionRef = useRef(1);

	const measure = useCallback(() => {
		const viewport = viewportRef.current;
		const strip = stripRef.current;
		if (!viewport || !strip) return;
		const overflow = Math.max(0, strip.scrollWidth - viewport.clientWidth);
		setMaxOffset(overflow);
		setOffset((o) => Math.min(Math.max(0, o), overflow));
	}, []);

	useEffect(() => {
		measure();
		const ro = new ResizeObserver(measure);
		if (viewportRef.current) ro.observe(viewportRef.current);
		if (stripRef.current) ro.observe(stripRef.current);
		window.addEventListener("resize", measure);
		return () => {
			ro.disconnect();
			window.removeEventListener("resize", measure);
			if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
		};
	}, [measure]);

	const clampOffset = useCallback(
		(value: number) => Math.min(Math.max(0, value), maxOffset),
		[maxOffset],
	);

	const pauseAuto = useCallback((ms = 4000) => {
		pausedRef.current = true;
		if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
		pauseTimerRef.current = setTimeout(() => {
			pausedRef.current = false;
		}, ms);
	}, []);

	/** Slow auto-scroll to the end, then reverse (ping-pong). */
	useEffect(() => {
		if (maxOffset <= 0) return;
		let frame = 0;
		let last = performance.now();
		const speed = 32; // px / second

		const tick = (now: number) => {
			const dt = Math.min(0.05, (now - last) / 1000);
			last = now;
			if (!pausedRef.current && !dragRef.current.active) {
				setOffset((o) => {
					let next = o + directionRef.current * speed * dt;
					if (next >= maxOffset) {
						next = maxOffset;
						directionRef.current = -1;
					} else if (next <= 0) {
						next = 0;
						directionRef.current = 1;
					}
					return next;
				});
			}
			frame = requestAnimationFrame(tick);
		};

		frame = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(frame);
	}, [maxOffset]);

	/** Trackpad / mouse wheel → horizontal pan across the full roster */
	useEffect(() => {
		const viewport = viewportRef.current;
		if (!viewport) return;

		const onWheel = (e: WheelEvent) => {
			if (maxOffset <= 0) return;
			// Only hijack the wheel for genuinely horizontal gestures (trackpad
			// swipes). Normal vertical mouse-wheel scrolling must pass through
			// untouched so the page keeps scrolling past this section.
			if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
			e.preventDefault();
			pauseAuto();
			setOffset((o) => clampOffset(o + e.deltaX));
		};

		viewport.addEventListener("wheel", onWheel, { passive: false });
		return () => viewport.removeEventListener("wheel", onWheel);
	}, [clampOffset, maxOffset, pauseAuto]);

	/** Click-drag to scrub through everyone */
	useEffect(() => {
		const onMove = (e: PointerEvent) => {
			if (!dragRef.current.active) return;
			const dx = e.clientX - dragRef.current.startX;
			setOffset(clampOffset(dragRef.current.startOffset - dx));
		};
		const onUp = () => {
			if (dragRef.current.active) pauseAuto();
			dragRef.current.active = false;
		};
		window.addEventListener("pointermove", onMove);
		window.addEventListener("pointerup", onUp);
		return () => {
			window.removeEventListener("pointermove", onMove);
			window.removeEventListener("pointerup", onUp);
		};
	}, [clampOffset, pauseAuto]);

	const nudge = (dir: -1 | 1) => {
		pauseAuto();
		directionRef.current = dir;
		const step = (viewportRef.current?.clientWidth ?? 400) * 0.55;
		setOffset((o) => clampOffset(o + dir * step));
	};

	return (
		<section
			ref={sectionRef}
			id="team"
			className="relative flex min-h-[74vh] flex-col items-center overflow-hidden pt-16 pb-12 md:pt-20"
		>
			<div className="pointer-events-none absolute inset-0 opacity-70">
				{Array.from({ length: 40 }).map((_, i) => (
					<span
						key={i}
						className="absolute rounded-full bg-white"
						style={{
							width: i % 5 === 0 ? 3 : 1.5,
							height: i % 5 === 0 ? 3 : 1.5,
							left: `${(i * 17) % 100}%`,
							top: `${(i * 23) % 100}%`,
							opacity: 0.35 + ((i * 13) % 50) / 100,
						}}
					/>
				))}
			</div>

			<SoftCloud speed={0.28} className="left-[-4%] top-[8%] h-28 w-56 md:h-36 md:w-72" />
			<SoftCloud speed={0.38} className="right-[-6%] top-[12%] h-24 w-48 scale-x-[-1] md:h-32 md:w-64" />
			<SoftCloud speed={0.42} className="bottom-[6%] left-[-2%] h-32 w-64 md:h-40 md:w-80" />
			<SoftCloud speed={0.48} className="right-[-4%] bottom-[10%] h-28 w-56 scale-x-[-1] md:h-36 md:w-72" />

			<h2 className="relative z-10 mb-8 px-4 text-center font-pixel text-xl tracking-wider text-primary drop-shadow-[0_0_12px_rgba(193,185,242,0.5)] sm:text-2xl md:mb-14 md:text-3xl">
				Meet the Team
			</h2>

			<div className="relative z-10 flex w-full items-center gap-2 md:gap-4">
				<button
					type="button"
					aria-label="Scroll team left"
					onClick={() => nudge(-1)}
					disabled={offset <= 0}
					className="ml-2 hidden shrink-0 rounded-full border border-primary/25 bg-primary/10 px-3 py-2 font-outfit text-primary backdrop-blur-sm transition enabled:hover:bg-primary/20 disabled:opacity-30 sm:block md:ml-6"
				>
					←
				</button>

				<div
					ref={viewportRef}
					className="relative min-h-[420px] w-full flex-1 cursor-grab overflow-hidden active:cursor-grabbing md:min-h-[480px]"
					onPointerDown={(e) => {
						pauseAuto(6000);
						dragRef.current = {
							active: true,
							startX: e.clientX,
							startOffset: offset,
						};
					}}
				>
					<div
						ref={stripRef}
						className="relative w-max px-10 will-change-transform md:px-16"
						style={{ transform: `translateX(${-offset}px)` }}
					>
						<div className="absolute top-4 right-[-4%] left-[-4%] h-3 rounded-full bg-[repeating-linear-gradient(90deg,#c4a574_0px,#c4a574_6px,#a8844f_6px,#a8844f_10px,#d4b888_10px,#d4b888_14px)] shadow-[0_2px_6px_rgba(0,0,0,0.45)]" />

						<div className="relative flex items-start gap-10 pt-2 md:gap-14">
							{TEAM.map((member) => (
								<div
									key={member.src}
									className="relative flex w-36 shrink-0 flex-col items-center md:w-44"
									style={{ paddingTop: member.hang }}
								>
									<div className="absolute top-[10px] z-20 h-3.5 w-3.5 rounded-full border border-[#b8860b] bg-[#d4af37] shadow" />
									<div
										className="absolute top-[22px] left-1/2 w-px -translate-x-1/2 bg-[#cfcfcf]/80"
										style={{ height: Math.max(16, member.hang - 6) }}
									/>

									<div
										className="w-full bg-[#f5f2ea] p-2.5 pb-8 shadow-[0_12px_28px_rgba(0,0,0,0.45)] polaroid-sway"
										style={
											{
												"--polaroid-tilt": `${member.rotate}deg`,
												rotate: `var(--polaroid-tilt)`,
											} as React.CSSProperties
										}
									>
										<div className="flex aspect-square items-center justify-center overflow-hidden bg-[#d8d8d8]">
											<img
												src={member.src}
												alt={member.name}
												className="pointer-events-none h-full w-full object-cover"
												draggable={false}
											/>
										</div>
									</div>

									<div className="mt-3 max-w-[10.5rem] text-center md:max-w-[12rem]">
										<p className="font-outfit text-sm font-medium text-primary">
											{member.name}
										</p>
										<p className="font-outfit text-xs text-primary/70">
											{member.role}
										</p>
										<p className="font-outfit text-[10px] tracking-wide text-primary/45">
											{member.pronouns}
										</p>
									</div>
								</div>
							))}
						</div>
					</div>
				</div>

				<button
					type="button"
					aria-label="Scroll team right"
					onClick={() => nudge(1)}
					disabled={offset >= maxOffset - 1}
					className="mr-2 hidden shrink-0 rounded-full border border-primary/25 bg-primary/10 px-3 py-2 font-outfit text-primary backdrop-blur-sm transition enabled:hover:bg-primary/20 disabled:opacity-30 sm:block md:mr-6"
				>
					→
				</button>
			</div>

			<Rocket className="absolute bottom-10 left-6 z-20 h-14 w-14 opacity-90 md:left-12 md:h-16 md:w-16" />
		</section>
	);
}
