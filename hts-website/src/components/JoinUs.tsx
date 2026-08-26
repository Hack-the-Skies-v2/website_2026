"use client";

import PlanetFrame from "@/components/CloudFrame";
import { useEffect, useMemo, useRef, useState } from "react";
const CLOUDS = [
    {
        id: "a",
        src: "/join/03-organizers.jpg",
        cx: 16,
        cy: 15,
        w: 26,
        rotate: 4,
        delay: true,
    },
    {
        id: "b",
        src: "/join/04-collab.jpg",
        cx: 84,
        cy: 14,
        w: 20,
        rotate: -3,
        delay: false,
    },
    {
        id: "hero",
        src: "/join/01-cohort.jpg",
        cx: 50,
        cy: 50,
        w: 42,
        rotate: -2,
        delay: false,
    },
    {
        id: "c",
        src: "/join/06-workspace.jpg",
        cx: 17,
        cy: 84,
        w: 28,
        rotate: -5,
        delay: true,
    },
    {
        id: "d",
        src: "/join/08-lounge.jpg",
        cx: 83,
        cy: 83,
        w: 22,
        rotate: 3,
        delay: false,
    },
] as const;

const TRAIL_ORDER = ["a", "b", "hero", "c", "d"] as const;
const ROCKET_END_T = 0.9;
const FLIGHT_MS = 2800;

function RocketGlyph({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 64 64" className={className} aria-hidden>
            <path
                d="M32 4c8 10 12 24 12 36 0 4-2 8-4 10l-8 8-8-8c-2-2-4-6-4-10 0-12 4-26 12-36z"
                fill="#e8d5a8"
            />
            <path d="M24 42l-10 4 6-12z" fill="#9aabbc" />
            <path d="M40 42l10 4-6-12z" fill="#9aabbc" />
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

function buildTrailPath() {
    const byId = Object.fromEntries(CLOUDS.map((c) => [c.id, c]));
    const pts = TRAIL_ORDER.map((id) => {
        const c = byId[id];
        return { x: c.cx, y: c.cy };
    });
    return pts
        .map((p, i) => {
            if (i === 0) return `M ${p.x} ${p.y}`;
            const prev = pts[i - 1];
            const mx = (prev.x + p.x) / 2;
            const my = (prev.y + p.y) / 2 - 4;
            return `Q ${mx} ${my} ${p.x} ${p.y}`;
        })
        .join(" ");
}

function pointAlongPath(path: SVGPathElement, t: number) {
    const len = path.getTotalLength();
    const d = Math.max(0, Math.min(1, t)) * len;
    const p = path.getPointAtLength(d);
    const p2 = path.getPointAtLength(Math.min(len, d + 0.35));
    const angle = (Math.atan2(p2.y - p.y, p2.x - p.x) * 180) / Math.PI + 90;
    return { x: p.x, y: p.y, angle };
}

function RocketTrail({ active }: { active: boolean }) {
    const pathD = useMemo(() => buildTrailPath(), []);
    const measureRef = useRef<SVGPathElement>(null);
    const glowRef = useRef<SVGPathElement>(null);
    const dashRef = useRef<SVGPathElement>(null);
    const sparkRef = useRef<SVGPathElement>(null);
    const [rocket, setRocket] = useState({ x: 0, y: 0, angle: 0, visible: false });
    const playedRef = useRef(false);

    useEffect(() => {
        const path = measureRef.current;
        if (!path) return;
        const start = pointAlongPath(path, 0);
        setRocket({ ...start, visible: true });

        const len = path.getTotalLength();
        for (const el of [glowRef.current, dashRef.current, sparkRef.current]) {
            if (!el) continue;
            el.style.strokeDasharray = `${len}`;
            el.style.strokeDashoffset = `${len}`;
        }
    }, [pathD]);

    useEffect(() => {
        if (!active || playedRef.current) return;
        const path = measureRef.current;
        if (!path) return;
        playedRef.current = true;

        const len = path.getTotalLength();
        const start = performance.now();

        for (const el of [glowRef.current, dashRef.current, sparkRef.current]) {
            if (!el) continue;
            el.style.transition = `stroke-dashoffset ${FLIGHT_MS}ms ease-in-out`;
            el.style.strokeDashoffset = `${len * (1 - ROCKET_END_T)}`;
        }

        let frame = 0;
        const tick = (now: number) => {
            const t = Math.min(1, (now - start) / FLIGHT_MS);
            const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
            const pos = pointAlongPath(path, eased * ROCKET_END_T);
            setRocket({ ...pos, visible: true });
            if (t < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frame);
    }, [active]);

    return (
        <>
            <svg
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                className="pointer-events-none absolute inset-0 z-[1] h-full w-full overflow-visible"
                aria-hidden
            >
                <defs>
                    <linearGradient
                        id="rocket-trail-glow"
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="100%"
                    >
                        <stop offset="0%" stopColor="rgba(193,185,242,0.2)" />
                        <stop offset="50%" stopColor="rgba(232,208,120,0.8)" />
                        <stop offset="100%" stopColor="rgba(232,160,64,1)" />
                    </linearGradient>
                    <filter id="trail-blur" x="-30%" y="-30%" width="160%" height="160%">
                        <feGaussianBlur stdDeviation="0.8" result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                <path ref={measureRef} d={pathD} fill="none" stroke="none" />

                <path
                    ref={glowRef}
                    d={pathD}
                    fill="none"
                    stroke="rgba(193,185,242,0.4)"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    filter="url(#trail-blur)"
                />
                <path
                    ref={dashRef}
                    d={pathD}
                    fill="none"
                    stroke="url(#rocket-trail-glow)"
                    strokeWidth="1.15"
                    strokeLinecap="round"
                />
                <path
                    ref={sparkRef}
                    d={pathD}
                    fill="none"
                    stroke="rgba(255,240,200,0.9)"
                    strokeWidth="0.45"
                    strokeLinecap="round"
                />
            </svg>

            {rocket.visible && (
                <div
                    className="pointer-events-none absolute z-[5] drop-shadow-[0_0_14px_rgba(232,208,120,0.95)]"
                    style={{
                        left: `${rocket.x}%`,
                        top: `${rocket.y}%`,
                        width: "min(14%, 3.75rem)",
                        transform: `translate(-50%, -50%) rotate(${rocket.angle}deg)`,
                    }}
                >
                    <RocketGlyph className="h-full w-full" />
                </div>
            )}
        </>
    );
}

export default function JoinUs() {
    const sectionRef = useRef<HTMLElement>(null);
    const [rocketActive, setRocketActive] = useState(false);

    useEffect(() => {
        const el = sectionRef.current;
        if (!el) return;

        const io = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && entry.intersectionRatio >= 0.35) {
                    setRocketActive(true);
                    io.disconnect();
                }
            },
            { threshold: [0.35, 0.5] },
        );
        io.observe(el);
        return () => io.disconnect();
    }, []);

    return (
        <section
            ref={sectionRef}
            id="join"
            className="relative flex min-h-screen items-center py-20 md:py-24 lg:py-28"
        >
            <div className="relative z-10 mx-auto grid w-full max-w-[90rem] items-center gap-10 px-6 md:gap-12 md:px-10 lg:grid-cols-[0.9fr_1.15fr] lg:gap-8 lg:px-12 xl:gap-12 xl:px-16">
                <div className="relative z-20 max-w-xl">
                    <h2 className="font-outfit mb-6 text-4xl font-semibold text-primary drop-shadow-[0_0_12px_rgba(193,185,242,0.5)] md:text-5xl lg:text-6xl">
                        Join Us
                    </h2>
                    <p className="font-outfit text-lg leading-relaxed text-primary drop-shadow-[0_0_8px_rgba(193,185,242,0.45)] md:text-xl lg:text-2xl">
                        A hackathon founded by high school students,{" "}
                        <span className="hidden md:inline">
                            <br />
                        </span>
                        for high school students.
                    </p>
                </div>

                <div
                    className="relative mx-auto aspect-square w-full max-w-xl sm:max-w-2xl lg:mx-0 lg:aspect-[5/4] lg:max-w-none lg:min-h-[28rem] xl:min-h-[34rem]"
                    aria-hidden
                >
                    <RocketTrail active={rocketActive} />

                    {CLOUDS.map((cloud) => (
                        <div
                            key={cloud.id}
                            className={`absolute z-[2] aspect-[100/108] ${cloud.delay
                                    ? "cloud-frame-float-delayed"
                                    : "cloud-frame-float"
                                }`}
                            style={{
                                width: `${cloud.w}%`,
                                left: `${cloud.cx}%`,
                                top: `${cloud.cy}%`,
                                transform: "translate(-50%, -50%)",
                            }}
                        >
                            <PlanetFrame rotate={cloud.rotate}>
                                <img
                                    src={cloud.src}
                                    alt=""
                                    className="h-full w-full object-cover"
                                />
                            </PlanetFrame>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
