"use client";

import Link from "next/link";
import ParallaxLayer from "@/components/ParallaxLayer";

export default function Introduction() {
  return (
    <>
      <Link href ="/">
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
              hover:scale-105
          "
          > Return to Home Page
          </button>
      </Link>
      <ParallaxLayer>
          <h1 className="
            mt-48
            text-center
            font-outfit text-5xl md:text-5xl lg:text-7xl font-semibold text-primary select-none">
            Application Portal
          </h1>
          <h2 className="
          mt-6
          text-center 
          font-outfit 
          md:text-xl 
          md:text-2xl 
          lg:text-3xl 
          text-primary">
            Ready to come to Hack The Skies? You are a few questions away!
          </h2>
      </ParallaxLayer>
    </>
  );
}