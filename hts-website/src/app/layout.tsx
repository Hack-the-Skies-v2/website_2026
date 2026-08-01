import type { Metadata } from "next";
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
	title: "Hack the Skies 2026",
	description: "A hackathon founded by high school students, for high school students.",
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
			<body className="min-h-full flex flex-col">{children}</body>
		</html>
	);
}
