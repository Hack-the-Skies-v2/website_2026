"use client";

import Link from "next/link";
import ApplicationForm from "@/components/ApplicationForm";
import Footer from "@/components/Footer";

export default function Apply() {
    return (
        <main className="flex flex-col min-h-screen">
            <Link href="/">
                <button
                    type="button"
                    className="
                        fixed top-4 right-4 z-50
                        rounded-full
                        bg-button
                        px-6 py-2
                        font-outfit
                        text-base text-white
                        shadow-[0_0_20px_rgba(130,104,180,0.45)]
                        transition-all duration-150
                        md:px-8 md:py-3 md:text-lg
                        hover:bg-[#8268B4]
                        cursor-pointer
                        hover:scale-105
                    "
                >
                    Return to Home
                </button>
            </Link>
            <div className="flex-1 flex items-center justify-center">
                <h1 className="text-center justify-center font-outfit text-5xl md:text-6xl lg:text-7xl font-semibold text-primary">Coming Soon</h1>
            </div>
            {/* <div className="flex-1">
				<div className="pt-24 pb-12">
					<h1 className="
						text-center
						font-outfit text-5xl md:text-6xl lg:text-7xl font-semibold text-primary select-none mb-6">
						Application Portal
					</h1>
					<h2 className="
						text-center 
						font-outfit 
						text-lg md:text-xl lg:text-2xl
						text-primary mb-12">
						Ready to come to Hack the Skies? You are a few questions away!
					</h2>
				</div>
				<ApplicationForm />
			</div> */}
            <Footer />
        </main>
    );
}
