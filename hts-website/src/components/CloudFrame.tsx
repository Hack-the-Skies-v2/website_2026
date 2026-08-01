"use client";

import { useId } from "react";

type PlanetFrameProps = {
	size?: number;
	className?: string;
	style?: React.CSSProperties;
	children?: React.ReactNode;
	rotate?: number;
};

/**
 * Planet frame — circular photo as the planet body (edge-to-edge, no gap),
 * with a tilted orbital ring that matches the Hack the Skies space look.
 * Rings split behind/in front of the globe for a simple 3D read.
 */
export default function PlanetFrame({
	size,
	className = "",
	style,
	children,
	rotate = 0,
}: PlanetFrameProps) {
	const uid = useId().replace(/:/g, "");
	const ringGrad = `planet-ring-${uid}`;
	const ringFront = `planet-ring-front-${uid}`;
	const ringClip = `planet-ring-clip-${uid}`;

	const sized =
		size != null ? { width: size, height: size * 1.08 } : undefined;

	return (
		<div
			className={`relative h-full w-full select-none ${className}`}
			style={{
				...sized,
				transform: rotate ? `rotate(${rotate}deg)` : undefined,
				...style,
			}}
		>
			{/* Atmospheric glow */}
			<div
				className="pointer-events-none absolute rounded-full"
				style={{
					inset: "6%",
					background:
						"radial-gradient(circle, rgba(193,185,242,0.45) 0%, rgba(120,90,200,0.12) 45%, transparent 70%)",
					filter: "blur(10px)",
				}}
			/>

			{/* Ring — back half (behind the planet) */}
			<svg
				viewBox="0 0 100 108"
				className="pointer-events-none absolute inset-0 z-[1] h-full w-full overflow-visible"
				aria-hidden
			>
				<defs>
					<linearGradient id={ringGrad} x1="0%" y1="0%" x2="100%" y2="100%">
						<stop offset="0%" stopColor="#F0E6A8" stopOpacity="0.15" />
						<stop offset="35%" stopColor="#E8D078" stopOpacity="0.95" />
						<stop offset="55%" stopColor="#C1B9F2" stopOpacity="0.9" />
						<stop offset="100%" stopColor="#F0E6A8" stopOpacity="0.2" />
					</linearGradient>
				</defs>
				<g transform="rotate(-26 50 54)">
					{/* Outer band */}
					<ellipse
						cx="50"
						cy="54"
						rx="42"
						ry="11"
						fill="none"
						stroke={`url(#${ringGrad})`}
						strokeWidth="2.2"
						opacity="0.5"
						strokeLinecap="round"
					/>
					{/* Inner band — sits closer to the globe */}
					<ellipse
						cx="50"
						cy="54"
						rx="39.5"
						ry="9.5"
						fill="none"
						stroke="rgba(255,245,200,0.55)"
						strokeWidth="1.1"
						opacity="0.75"
					/>
				</g>
			</svg>

			{/* Planet body — photo fills the disc completely */}
			<div
				className="absolute z-[2] overflow-hidden rounded-full"
				style={{
					inset: "11% 12%",
					boxShadow:
						"inset 0 0 0 1px rgba(255,255,255,0.22), 0 8px 28px rgba(10,8,24,0.55)",
				}}
			>
				<div
					className="pointer-events-none absolute inset-0 z-[1] rounded-full"
					style={{
						background:
							"radial-gradient(circle at 32% 28%, transparent 35%, rgba(20,17,40,0.28) 100%)",
					}}
				/>
				<div className="relative z-0 h-full w-full">{children}</div>
			</div>

			{/* Ring — front half arcs across the planet */}
			<svg
				viewBox="0 0 100 108"
				className="pointer-events-none absolute inset-0 z-[3] h-full w-full overflow-visible"
				aria-hidden
			>
				<defs>
					<linearGradient id={ringFront} x1="0%" y1="0%" x2="100%" y2="0%">
						<stop offset="0%" stopColor="#F0E6A8" stopOpacity="0.05" />
						<stop offset="40%" stopColor="#F2E28A" stopOpacity="1" />
						<stop offset="60%" stopColor="#D4CCF5" stopOpacity="0.95" />
						<stop offset="100%" stopColor="#F0E6A8" stopOpacity="0.05" />
					</linearGradient>
					<clipPath id={ringClip}>
						<rect x="0" y="54" width="100" height="54" />
					</clipPath>
				</defs>
				<g transform="rotate(-26 50 54)" clipPath={`url(#${ringClip})`}>
					<ellipse
						cx="50"
						cy="54"
						rx="42"
						ry="11"
						fill="none"
						stroke={`url(#${ringFront})`}
						strokeWidth="2.4"
						strokeLinecap="round"
						style={{
							filter: "drop-shadow(0 0 3px rgba(232,208,120,0.65))",
						}}
					/>
					<ellipse
						cx="50"
						cy="54"
						rx="39.5"
						ry="9.5"
						fill="none"
						stroke="rgba(255,250,220,0.65)"
						strokeWidth="1.15"
					/>
				</g>
			</svg>
		</div>
	);
}
