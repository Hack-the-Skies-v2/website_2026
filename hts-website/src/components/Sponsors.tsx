import fs from "node:fs";
import path from "node:path";

/**
 * Confirmed sponsors only (Progress = "Accepted" on the sponsor tracker).
 * Drop a matching logo at /public/sponsors/<logo>.png|svg and it renders
 * automatically — checked at request time on the server, so a missing
 * file never flashes a broken image in the browser.
 */
const SPONSORS = [
	{
		name: "Siemens",
		url: "https://www.siemens.com/",
		logo: "/sponsors/siemens.svg",
		size: "lg",
	},
	{
		name: "NordVPN",
		url: "https://nordvpn.com/hackathons",
		logo: "/sponsors/nordvpn.svg",
		rel: "sponsored nofollow noreferrer",
		size: "lg",
	},
	{
		name: "NordPass",
		url: "https://nordpass.com/",
		logo: "/sponsors/nordpass.svg",
		rel: "sponsored nofollow noreferrer",
		size: "md",
	},
	{
		name: "Incogni",
		url: "https://incogni.com/",
		logo: "/sponsors/incogni.svg",
		rel: "sponsored nofollow noreferrer",
		size: "md",
	},
	{
		name: "Saily",
		url: "https://saily.com/",
		logo: "/sponsors/saily.svg",
		rel: "sponsored nofollow noreferrer",
		size: "md",
	},
	{
		name: "Interview Cake",
		url: "https://www.interviewcake.com/",
		logo: "/sponsors/interview-cake.svg",
		size: "md",
	},
	{
		name: "Codecrafters",
		url: "https://codecrafters.io/",
		logo: "/sponsors/codecrafters.svg",
		size: "sm",
	},
	{
		name: "TT Math",
		url: null,
		logo: "/sponsors/tt-math.png",
		size: "sm",
	},
	{
		name: "Jukebox",
		url: null,
		logo: "/sponsors/jukebox.png",
		size: "sm",
	},
] as const;

const SIZE_CLASSES = {
	lg: "h-20 md:h-24 lg:col-span-2",
	md: "h-16 md:h-20",
	sm: "h-14 md:h-16",
} as const;

function hasLogoFile(logo: string): boolean {
	return fs.existsSync(path.join(process.cwd(), "public", logo));
}

function SponsorMark({ name }: { name: string }) {
	return (
		<span className="px-2 text-center font-outfit text-xs font-semibold tracking-wide text-[#171426] md:text-sm">
			{name}
		</span>
	);
}

function SponsorCard({ sponsor }: { sponsor: (typeof SPONSORS)[number] }) {
	const logoExists = hasLogoFile(sponsor.logo);
	const cardClass = `group flex w-full items-center justify-center rounded-xl bg-white p-2.5 shadow-[0_6px_16px_rgba(0,0,0,0.3)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_10px_22px_rgba(0,0,0,0.4)] ${SIZE_CLASSES[sponsor.size]}`;
	const content = logoExists ? (
		// eslint-disable-next-line @next/next/no-img-element
		<img
			src={sponsor.logo}
			alt={sponsor.name}
			className="h-full w-full object-contain grayscale-[15%] transition duration-300 group-hover:grayscale-0"
			draggable={false}
		/>
	) : (
		<SponsorMark name={sponsor.name} />
	);

	if (!sponsor.url) {
		return <div className={cardClass}>{content}</div>;
	}

	return (
		<a
			href={sponsor.url}
			target="_blank"
			rel={sponsor.rel ?? "noreferrer"}
			className={cardClass}
		>
			{content}
		</a>
	);
}

function DriftingCloud({ className, duration }: { className?: string; duration: number }) {
	return (
		<div
			className={`pointer-events-none absolute opacity-50 ${className ?? ""}`}
			style={{ animation: `sponsor-drift ${duration}s ease-in-out infinite` }}
			aria-hidden
		>
			<svg viewBox="0 0 200 100" className="h-full w-full">
				<circle cx="40" cy="55" r="28" fill="white" />
				<circle cx="75" cy="40" r="34" fill="white" />
				<circle cx="115" cy="48" r="30" fill="white" />
				<circle cx="150" cy="58" r="24" fill="white" />
				<circle cx="95" cy="65" r="26" fill="white" />
			</svg>
		</div>
	);
}

export default function Sponsors() {
	return (
		<section
			id="sponsors"
			className="relative flex min-h-screen flex-col items-center overflow-hidden px-4 py-24 md:py-32"
		>
			<div className="pointer-events-none absolute inset-0" aria-hidden>
				{Array.from({ length: 45 }).map((_, i) => (
					<span
						key={i}
						className="absolute rounded-full bg-white"
						style={{
							width: i % 6 === 0 ? 3 : 1.5,
							height: i % 6 === 0 ? 3 : 1.5,
							left: `${(i * 19) % 100}%`,
							top: `${(i * 29) % 100}%`,
							opacity: 0.25 + ((i * 11) % 60) / 100,
							animation: `sponsor-twinkle ${3 + (i % 5)}s ease-in-out infinite`,
							animationDelay: `${(i % 7) * 0.4}s`,
						}}
					/>
				))}
			</div>

			<DriftingCloud className="left-[-6%] top-[10%] h-24 w-52 md:h-32 md:w-72" duration={14} />
			<DriftingCloud className="right-[-8%] top-[18%] h-20 w-44 scale-x-[-1] md:h-28 md:w-64" duration={17} />
			<DriftingCloud className="bottom-[8%] left-[-4%] h-28 w-56 md:h-36 md:w-80" duration={19} />
			<DriftingCloud className="right-[-6%] bottom-[14%] h-20 w-44 scale-x-[-1] md:h-28 md:w-64" duration={15} />

			<h2 className="relative z-10 mb-4 px-4 text-center font-pixel text-xl tracking-wider text-primary drop-shadow-[0_0_12px_rgba(193,185,242,0.5)] sm:text-2xl md:text-3xl">
				Our Sponsors
			</h2>
			<p className="relative z-10 mb-12 max-w-xl text-center font-outfit text-sm text-white/60 md:mb-16">
				Hack the Skies wouldn&apos;t fly without the teams backing us. Huge
				thanks to everyone below.
			</p>

			<div className="relative z-10 flex w-full max-w-3xl flex-col gap-3 md:gap-4">
				<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4">
					{SPONSORS.filter((s) => s.size !== "sm").map((sponsor) => (
						<SponsorCard key={sponsor.name} sponsor={sponsor} />
					))}
				</div>
				<div className="grid grid-cols-3 gap-3 md:gap-4">
					{SPONSORS.filter((s) => s.size === "sm").map((sponsor) => (
						<SponsorCard key={sponsor.name} sponsor={sponsor} />
					))}
				</div>
			</div>

			<p className="relative z-10 mt-14 max-w-lg text-center font-outfit text-xs tracking-wide text-white/45 md:text-sm">
				Interested in sponsoring Hack the Skies?{" "}
				<a href="#contact" className="text-primary underline underline-offset-4 hover:opacity-80">
					Get in touch
				</a>
				.
			</p>
		</section>
	);
}
