import Link from "next/link";
import ParallaxLayer from "@/components/ParallaxLayer";

export default function AuthErrorPage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-16">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <ParallaxLayer
          speed={0.2}
          className="absolute right-[-2rem] top-16 w-56 rotate-12 opacity-75 md:right-10 md:w-80"
        >
          <img src="/Constellation.png" alt="" className="h-full w-full" />
        </ParallaxLayer>
        <ParallaxLayer
          speed={0.12}
          className="absolute left-1/2 top-[-80px] w-[850px] -translate-x-1/2 opacity-20"
        >
          <img src="/Cloud1.webp" alt="" className="h-full w-full" />
        </ParallaxLayer>
      </div>

      <section className="relative z-10 w-full max-w-md rounded-3xl border border-primary/25 bg-[#171329]/90 p-6 text-center shadow-[0_0_50px_rgba(107,87,155,0.25)] backdrop-blur-xl sm:p-8">
        <Link href="/" className="mb-8 inline-flex items-center gap-3">
          <img
            src="/favicon.ico"
            alt="Hack the Skies Logo"
            className="h-10 w-10 object-contain drop-shadow-[0_0_15px_rgba(193,185,242,0.5)]"
          />
          <span className="font-outfit text-2xl font-bold text-primary">
            Hack the Skies
          </span>
        </Link>
        <p className="mb-3 font-outfit text-sm font-medium uppercase tracking-[0.2em] text-red-300">
          Authentication error
        </p>
        <h1 className="font-outfit text-3xl font-bold text-primary">
          That link did not work
        </h1>
        <p className="mt-4 font-outfit leading-relaxed text-primary/70">
          The link may have expired or already been used. Request a new one and
          try again.
        </p>
        <Link
          href="/auth"
          className="mt-8 inline-flex rounded-xl bg-button px-6 py-3 font-outfit font-semibold text-white shadow-[0_0_20px_rgba(130,104,180,0.45)] transition hover:bg-[#8268B4]"
        >
          Return to sign in
        </Link>
      </section>
    </main>
  );
}
