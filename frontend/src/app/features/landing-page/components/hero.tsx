"use client";

import { useState } from "react";
import { Search, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const AREAS = ["Westlands", "Kilimani", "Karen", "Lavington", "Kasarani", "Roysambu"];

export function Hero() {
  const [query, setQuery] = useState("");

  return (
    <section className="bg-gradient-to-br from-muted via-background to-muted px-6 py-24">
      <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
        <span className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-4 py-1.5 text-sm font-medium text-secondary">
          <MapPin className="h-3.5 w-3.5" />
          Nairobi&apos;s simplest house-hunting platform
        </span>

        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Find your next
          <br />
          <span className="text-secondary">home in Nairobi</span>
        </h1>

        <p className="mt-6 max-w-xl text-lg text-muted-foreground">
          Landlords pin exact locations. Tenants find homes directly. No agents. No middlemen.
          No extra fees.
        </p>

        <div className="mt-8 flex w-full max-w-xl gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by area — Kilimani, Karen..."
              className="pl-9"
            />
          </div>
          <Button size="lg" className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
            Search
          </Button>
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {AREAS.map((area) => (
            <button
              key={area}
              className="rounded-full border border-border bg-background px-4 py-1.5 text-sm text-foreground hover:border-secondary hover:text-secondary transition-colors"
            >
              {area}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
