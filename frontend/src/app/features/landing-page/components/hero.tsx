"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, MapPin, Building2, Map } from "lucide-react";
import { Input } from "@/components/ui/input";

const POPULAR_AREAS = ["Westlands", "Kilimani", "Karen", "Lavington", "Kasarani"];

export function Hero() {
  const router = useRouter();
  const [searchArea, setSearchArea] = useState("");

  function handleSearch(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (searchArea.trim()) {
      router.push(`/browse?area=${encodeURIComponent(searchArea.trim())}`);
    } else {
      router.push("/browse");
    }
  }

  return (
    <section className="relative flex min-h-[calc(100vh-65px)] items-center overflow-hidden">
      {/* Preloaded local background image */}
      <Image
        src="/hero-bg.jpg"
        alt="Nairobi Homes"
        fill
        priority
        quality={85}
        sizes="100vw"
        className="object-cover object-center"
      />
      {/* Overlay */}
      <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-[1px]" />

      <div className="relative z-10 mx-auto w-full max-w-6xl px-6 py-24 sm:py-28">
        {/* Headline — left aligned, large */}
        <div className="max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-secondary/30 bg-secondary/10 px-3.5 py-1.5 text-xs font-bold text-secondary backdrop-blur-md">
            <Building2 className="h-3.5 w-3.5" /> Direct Landlord & Tenant Portal
          </div>
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-white sm:text-6xl lg:text-7xl">
            Find your next
            <br />
            <span className="text-secondary">home in Nairobi</span>
          </h1>

          <p className="text-base sm:text-lg text-white/80 max-w-xl leading-relaxed">
            Landlords pin exact locations. Tenants find verified homes directly. Zero agent commissions, zero hassle.
          </p>
        </div>

        {/* Immediate Search Bar Fold (HCI Enhancement) */}
        <form onSubmit={handleSearch} data-tour="hero-search" className="mt-8 max-w-2xl">
          <div className="flex flex-col sm:flex-row items-stretch gap-2.5 rounded-2xl bg-card/95 p-2.5 shadow-2xl border border-white/20 backdrop-blur-md">
            <div className="relative flex-1 flex items-center">
              <MapPin className="absolute left-3.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchArea}
                onChange={(e) => setSearchArea(e.target.value)}
                placeholder="Search area (e.g. Kilimani, Westlands, Karen)..."
                className="pl-10 h-11 text-sm border-0 bg-transparent shadow-none focus-visible:ring-0 text-foreground"
              />
            </div>
            <button
              type="submit"
              className="flex items-center justify-center gap-2 rounded-xl bg-secondary px-6 py-3 text-sm font-bold text-secondary-foreground hover:bg-secondary/90 transition-all shadow-md shrink-0 cursor-pointer"
            >
              <Search className="h-4 w-4" />
              <span>Search Homes</span>
            </button>
          </div>

          {/* Quick Area Pills */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-xs text-white/60 font-medium">Popular:</span>
            {POPULAR_AREAS.map((area) => (
              <button
                type="button"
                key={area}
                onClick={() => router.push(`/browse?area=${encodeURIComponent(area)}`)}
                className="rounded-full bg-white/10 border border-white/15 px-3 py-1 text-xs font-semibold text-white/90 hover:bg-white/20 hover:text-white transition-all backdrop-blur-xs cursor-pointer"
              >
                {area}
              </button>
            ))}
          </div>
        </form>

        {/* Primary CTA Buttons */}
        <div className="mt-10 flex flex-wrap items-center gap-4">
          <button
            onClick={() => router.push("/browse")}
            className="flex items-center gap-2.5 rounded-xl bg-primary px-7 py-3.5 font-bold text-primary-foreground hover:bg-primary/90 transition-all shadow-lg text-sm cursor-pointer"
          >
            Browse Available Homes →
          </button>
          <Link
            href="/register?role=LANDLORD"
            className="flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-6 py-3.5 text-sm font-bold text-white backdrop-blur-md hover:bg-white/20 transition-all cursor-pointer"
          >
            <Building2 className="h-4 w-4 text-secondary" /> List Your Property
          </Link>
          <Link
            href="/map"
            className="flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-6 py-3.5 text-sm font-bold text-white backdrop-blur-md hover:bg-white/20 transition-all cursor-pointer"
          >
            <Map className="h-4 w-4 text-secondary" /> Explore Map
          </Link>
        </div>

        {/* Landlord hint */}
        <p className="mt-6 text-xs text-white/60">
          Are you a landlord?{" "}
          <Link
            href="/register?role=LANDLORD"
            className="font-bold text-secondary underline underline-offset-2 hover:no-underline"
          >
            Register as a landlord
          </Link>{" "}
          and publish your listings for free.
        </p>
      </div>
    </section>
  );
}