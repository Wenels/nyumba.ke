"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const AREAS = ["Westlands", "Kilimani", "Karen", "Lavington", "Kasarani", "Roysambu"];

export function Hero() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  function handleSearch() {
    if (query.trim()) {
      router.push(`/browse?area=${encodeURIComponent(query.trim())}`);
    } else {
      router.push("/browse");
    }
  }

  function handleAreaPill(area: string) {
    router.push(`/browse?area=${encodeURIComponent(area)}`);
  }

  return (
    <section className="relative min-h-[580px] flex items-center justify-center overflow-hidden">
      {/* Background house image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1600&q=80')`,
        }}
      />
      {/* Overlay */}
      <div className="absolute inset-0 bg-foreground/60" />

      <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center px-6 py-24 text-center">
        <span className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-background/20 bg-background/10 px-4 py-1.5 text-sm font-medium text-background backdrop-blur-sm">
          <MapPin className="h-3.5 w-3.5 text-secondary" />
          Nairobi&apos;s simplest house-hunting platform
        </span>

        <h1 className="text-4xl font-bold tracking-tight text-background sm:text-5xl">
          Find your next
          <br />
          <span className="text-secondary">home in Nairobi</span>
        </h1>

        <p className="mt-6 max-w-xl text-lg text-background/80">
          Landlords pin exact locations. Tenants find homes directly. No agents. No middlemen.
          No extra fees.
        </p>

        <div className="mt-8 flex w-full max-w-xl gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search by area — Kilimani, Karen..."
              className="pl-9 bg-background/95 border-0"
            />
          </div>
          <Button
            onClick={handleSearch}
            size="lg"
            className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
          >
            Search
          </Button>
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {AREAS.map((area) => (
            <button
              key={area}
              onClick={() => handleAreaPill(area)}
              className="rounded-full border border-background/30 bg-background/10 px-4 py-1.5 text-sm text-background backdrop-blur-sm hover:bg-background/20 hover:border-secondary transition-colors"
            >
              {area}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
