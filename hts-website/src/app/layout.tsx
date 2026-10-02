import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import {
	Geist,
	Geist_Mono,
	Outfit,
	Libre_Baskerville,
	Press_Start_2P,
} from "next/font/google";
import "./globals.css";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

const outfit = Outfit({
	variable: "--font-outfit",
	subsets: ["latin"],
});

const libre = Libre_Baskerville({
	variable: "--font-libre",
	subsets: ["latin"],
	weight: "400",
});

const pixel = Press_Start_2P({
	variable: "--font-pixel",
	subsets: ["latin"],
	weight: "400",
});

export const metadata: Metadata = {
	metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://www.hacktheskies.com"),
	title: "Hack the Skies 2026",
	description: "Date: October 17-18 • Location: Humber College North Campus",
	openGraph: {
		title: "Hack the Skies 2026",
		description: "Date: October 17-18 • Location: Humber College North Campus",
		type: "website",
		images: [
			{
				url: "/Embed.jpeg",
				alt: "Hack the Skies 2026",
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		title: "Hack the Skies 2026",
		description: "Date: October 17-18 • Location: Humber College North Campus",
		images: ["/Embed.jpeg"],
	},
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html
			lang="en"
			className={`${geistSans.variable} ${geistMono.variable} ${outfit.variable} ${libre.variable} ${pixel.variable} h-full antialiased`}
		>
			<body className="min-h-full flex flex-col">
				{children}
				<Analytics />
			</body>
		</html>
	);
}
