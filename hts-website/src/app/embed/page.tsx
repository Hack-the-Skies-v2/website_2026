import type { Metadata } from "next";

export const metadata: Metadata = {
    icons: {
        icon: "/favicon.ico",
    },
};

export default function EmbedPage() {
    return (
        <main className="relative isolate flex min-h-screen items-center justify-center overflow-hidden px-6 text-center">
            <div className="relative z-10">
                <div className="relative">
                    <img
                        src="/favicon.ico"
                        alt="Hack the Skies logo"
                        className="absolute right-full top-1/2 mr-4 h-12 w-12 -translate-y-1/2 object-contain md:h-16 md:w-16"
                    />
                    <h1 className="font-outfit text-5xl font-semibold text-primary select-none md:text-6xl lg:text-7xl">
                        Hack the Skies
                    </h1>
                </div>
                <div className="relative flex items-center justify-center -space-x-1 text-7xl font-libre text-primary select-none md:-space-x-3 md:text-8xl lg:-space-x-4 lg:text-[9.5rem]">
                    <span className="drop-shadow-[0_0_15px_rgba(193,185,242,0.8)]">2</span>
                    <img
                        src="/MainPlanet.png"
                        className="h-[1.2em] w-[1.2em] object-contain z-10 opacity-90 -mx-3 md:h-[1.3em] md:w-[1.3em] md:-mx-4 lg:h-[1.5em] lg:w-[1.5em] lg:-mx-6 translate-x-0.5 md:translate-x-1 lg:translate-x-1.5 -translate-y-0.5 md:-translate-y-1 lg:-translate-y-1.5 blur-[0.4px] pointer-events-none drop-shadow-[0_0_40px_rgba(130,104,180,0.75)]"
                        alt="0"
                    />
                    <span className="drop-shadow-[0_0_15px_rgba(193,185,242,0.8)]">2</span>
                    <span className="drop-shadow-[0_0_15px_rgba(193,185,242,0.8)]">6</span>
                </div>
            </div>
        </main>
    );
}