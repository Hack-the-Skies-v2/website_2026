"use client";

import { useEffect, useRef, useState, type HTMLAttributes } from "react";

type ParallaxLayerProps = HTMLAttributes<HTMLDivElement> & {
	speed?: number;
};

export default function ParallaxLayer({
	className = "",
	style,
	speed = 0.12,
	children,
	...props
}: ParallaxLayerProps) {
	const ref = useRef<HTMLDivElement | null>(null);
	const [offset, setOffset] = useState(0);

	useEffect(() => {
		const update = () => {
			const el = ref.current;
			if (!el) return;

			const rect = el.getBoundingClientRect();
			const viewportCenter = window.innerHeight / 2;
			const elementCenter = rect.top + rect.height / 2;
			const distanceFromCenter = elementCenter - viewportCenter;

			setOffset(distanceFromCenter * speed);
		};

		update();

		let raf = 0;
		const onScroll = () => {
			cancelAnimationFrame(raf);
			raf = requestAnimationFrame(update);
		};

		window.addEventListener("scroll", onScroll, { passive: true });
		window.addEventListener("resize", onScroll);

		return () => {
			cancelAnimationFrame(raf);
			window.removeEventListener("scroll", onScroll);
			window.removeEventListener("resize", onScroll);
		};
	}, [speed]);

	return (
		<div
			{...props}
			ref={ref}
			className={className}
			style={style}
		>
			<div
				style={{
					transform: `translate3d(0, ${offset * 1.8}px, 0)`,
					willChange: "transform",
				}}
			>
				{children}
			</div>
		</div>
	);
}
