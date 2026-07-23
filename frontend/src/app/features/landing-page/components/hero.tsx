"use client";

import { useRouter } from "next/navigation";

export function Hero() {
  const router = useRouter();

  return (
    <section className="relative flex min-h-[calc(100vh-65px)] items-center overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('https://i.ibb.co/wZ3zjnNH/brian-wangenheim-sdi2-Hh-W-jk-E-unsplash.jpg')`,
        }}
      />
      {/* Overlay */}
      <div className="absolute inset-0 bg-foreground/75" />

      <div className="relative z-10 mx-auto w-full max-w-6xl px-6 py-20">
        {/* Headline — left aligned, large */}
        <h1 className="max-w-2xl text-5xl font-bold leading-tight tracking-tight text-background sm:text-6xl lg:text-7xl">
          Find your next
          <br />
          <span className="text-secondary">home in Nairobi</span>
        </h1>

        <p className="mt-6 max-w-lg text-lg text-background/80">
          Landlords pin exact locations. Tenants find homes directly. No agents.
          No middlemen. No extra fees.
        </p>

        {/* CTA buttons */}
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <a
            href="#how-it-works"
            className="rounded-lg border border-background/40 bg-background/10 px-6 py-3 font-semibold text-background backdrop-blur-sm hover:bg-background/20 transition-colors"
          >
            How It Works
          </a>
          <button
            onClick={() => router.push("/browse")}
            className="flex items-center gap-2 rounded-lg bg-secondary px-6 py-3 font-semibold text-secondary-foreground hover:bg-secondary/90 transition-colors"
          >
            Browse Listings →
          </button>
        </div>

        {/* Landlord link */}
        <p className="mt-6 text-sm text-background/60">
          Own a property?{" "}
          <a
            href="/register?role=LANDLORD"
            className="font-semibold text-secondary underline underline-offset-2 hover:no-underline"
          >
            Register as a landlord
          </a>{" "}
          and start listing for free.
        </p>
      </div>
    </section>
  );
}