import ParallaxLayer from "@/components/ParallaxLayer";
import Link from "next/link";

export default function Hero() {
    return (
        <section
            id="home"
            className="min-h-screen text-center justify-center content-center -translate-y-2 md:-translate-y-4 lg:-translate-y-6 pt-20 md:pt-24 [overflow-x:clip]"
        >
            <ParallaxLayer
                speed={0.35}
                className="
                    pointer-events-none
                    absolute
                    right-2
                    top-20
                    w-52
                    rotate-12
                    md:right-8
                    md:top-24
                    md:w-80
                    lg:right-12
                    lg:top-28
                    lg:w-[28rem]
                    constellation-glow
                    select-none
                    opacity-90
                    planet-float
                "
            >
                <img src="/Constellation.png" alt="" className="h-full w-full" />
            </ParallaxLayer>
            {/* <img
                src="/StarryCloud.webp"
                alt=""
                className="
                    pointer-events-none
                    absolute
                    left-[-80px]
                    top-[55%]
                    w-64
                    md:left-[-100px]
                    md:w-96
                    lg:left-[-120px]
                    lg:top-[60%]
                    lg:w-[32rem]
                    opacity-30
                    nebula-glow
                    select-none
                "
            /> */}
            <ParallaxLayer
                speed={0.45}
                className="
                    pointer-events-none
                    absolute
                    left-4
                    bottom-32
                    w-24
                    md:left-12
                    md:bottom-40
                    md:w-36
                    lg:left-20
                    lg:bottom-48
                    lg:w-44
                    opacity-80
                    magenta-planet-glow
                    select-none
                    planet-float-delayed
                "
            >
                <img src="/Planet1.webp" alt="" className="h-full w-full" />
            </ParallaxLayer>
            <h1 className="font-outfit text-5xl md:text-5xl lg:text-7xl font-semibold text-primary select-none">
                Hack the Skies
            </h1>
            <div className="flex items-center justify-center -space-x-1 md:-space-x-3 lg:-space-x-4 text-7xl md:text-8xl lg:text-[9.5rem] font-libre text-primary select-none">
                <span className="drop-shadow-[0_0_15px_rgba(193,185,242,0.8)]">2</span>
                <img
                    src="/MainPlanet.png"
                    className="h-[1.2em] w-[1.2em]
							md:h-[1.3em] md:w-[1.3em]
							lg:h-[1.5em] lg:w-[1.5em]
							object-contain
							z-10
							opacity-90
                            -mx-3
                            md:-mx-4
                            lg:-mx-6
                            translate-x-0.5 md:translate-x-1 lg:translate-x-1.5
                            -translate-y-0.5 md:-translate-y-1 lg:-translate-y-1.5
							blur-[0.4px]
                            pointer-events-none
                            drop-shadow-[0_0_40px_rgba(130,104,180,0.75)]"
                    alt="0"
                />
                <span className="drop-shadow-[0_0_15px_rgba(193,185,242,0.8)]">2</span>
                <span className="drop-shadow-[0_0_15px_rgba(193,185,242,0.8)]">6</span>
            </div>
            <h1 className="font-outfit text-lg md:text-xl lg:text-3xl text-primary select-none drop-shadow-[0_0_8px_rgba(193,185,242,0.5)] px-4">
                A hackathon founded by high school students,{" "}
                <span className="hidden md:inline">
                    <br />
                </span>
                for high school students.
            </h1>
            <div className="mt-4 flex flex-col items-center justify-center gap-3 sm:flex-row">
                {/* <Link href="/apply">
					<button
						type="button"
						className="
							rounded-full
							bg-button
							px-6 py-2
							font-outfit
							text-base text-white
							shadow-[0_0_20px_rgba(130,104,180,0.45)]
							transition-all duration-150
							md:px-8 md:py-3 md:text-lg
							hover:bg-[#8268B4]
							hover:scale-105
                            cursor-pointer
						"
					>Apply Now!
					</button>
				</Link> */}
                <button
                    type="button"
                    disabled
                    className="
                        rounded-full
                        bg-gray-400
                        px-6 py-2
                        font-outfit
                        text-base text-white
                        opacity-50
                        shadow-none
                        md:px-8 md:py-3 md:text-lg
                    "
                >
                    Apply Soon
                </button>

                <a
                    href="#downloads"
                    className="
						rounded-full
						bg-button
						px-6 py-2
						font-outfit
						text-base text-white
						shadow-[0_0_20px_rgba(130,104,180,0.45)]
						transition-all duration-150
						md:px-8 md:py-3 md:text-lg
						hover:bg-[#8268B4]
						hover:scale-105
					"
                >
                    Sponsor Us
                </a>
            </div>
        </section>
    );
}
