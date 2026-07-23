"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  XCircle,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  MapPin,
  DollarSign,
  Clock,
  Sparkles,
  Sliders,
  LayoutGrid,
  ArrowRight,
  ChevronRight,
  Eye,
} from "lucide-react";

const WITHOUT_POINTS = [
  {
    title: "Misleading & Catfish Photos",
    desc: "Online ads show renovated luxury rooms, but actual physical house is dark, rundown, and dilapidated.",
  },
  {
    title: "Viewing Fee Extortion",
    desc: "Middlemen charge non-refundable KSh 1,500 – 3,000 'viewing fees' and often vanish after receiving cash.",
  },
  {
    title: "Wrong GPS Map Pins",
    desc: "Map pins placed 2–5km away in completely different, unsafe neighborhoods.",
  },
  {
    title: "Zero Landlord Accountability",
    desc: "No direct contact with property owners, high broker markups, and zero recourse when scammed.",
  },
];

const WITH_POINTS = [
  {
    title: "100% Physical HD & 360° Verification",
    desc: "Every listing is inspected and verified on-site by the Nyumba team before publishing.",
  },
  {
    title: "Direct Landlord Contact — 0 Viewing Fees",
    desc: "Connect directly with real, verified property managers. No middlemen, no hidden fees.",
  },
  {
    title: "Pinpoint Accurate GPS Location",
    desc: "Guaranteed exact coordinates down to the building entrance on interactive maps.",
  },
  {
    title: "Verified Live Availability & Price",
    desc: "Real-time updates ensure listings are active, available, and priced transparently.",
  },
];

const COMPARISON_METRICS = [
  {
    icon: DollarSign,
    label: "Upfront Agent Fees",
    withoutVal: "KSh 2,500+ Lost",
    withVal: "KSh 0 (100% Free)",
    badgeColor: "text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-400",
  },
  {
    icon: MapPin,
    label: "Map Location Pin",
    withoutVal: "Off by 2–5 KM",
    withVal: "100% Exact GPS",
    badgeColor: "text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-950/40 dark:border-blue-800 dark:text-blue-400",
  },
  {
    icon: Clock,
    label: "House Hunting Time",
    withoutVal: "3+ Weeks Wasted",
    withVal: "Same-Day Direct Contact",
    badgeColor: "text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-400",
  },
];

export function Comparison() {
  const [viewMode, setViewMode] = useState<"cards" | "slider">("slider");
  const [sliderPos, setSliderPos] = useState<number>(50);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const sliderRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback(
    (clientX: number) => {
      if (!sliderRef.current) return;
      const rect = sliderRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      let percentage = (x / rect.width) * 100;
      if (percentage < 5) percentage = 5;
      if (percentage > 95) percentage = 95;
      setSliderPos(percentage);
    },
    []
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isDragging) return;
      handleMove(e.touches[0].clientX);
    },
    [isDragging, handleMove]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;
      handleMove(e.clientX);
    },
    [isDragging, handleMove]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      window.addEventListener("touchmove", handleTouchMove);
      window.addEventListener("touchend", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove]);

  return (
    <section className="relative overflow-hidden py-24 bg-gradient-to-b from-background via-muted/40 to-background">
      {/* Background visual elements */}
      <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 blur-3xl opacity-20 w-[600px] h-[300px] bg-gradient-to-r from-destructive/40 via-amber-500/30 to-emerald-500/40" />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
            Why Nyumba.ke? <span className="text-primary">The Difference is Clear.</span>
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            Traditional house hunting in Nairobi is broken, plagued by fake photos, location scams, and costly broker viewing fees. See how Nyumba.ke transforms your search.
          </p>

          {/* View Mode Toggle Controls */}
          <div className="pt-4 flex items-center justify-center gap-2">
            <div className="inline-flex items-center rounded-xl border border-border bg-card p-1 shadow-sm">
              <button
                onClick={() => setViewMode("cards")}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
                  viewMode === "cards"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <LayoutGrid className="h-4 w-4" />
                Side-by-Side Comparison
              </button>
              <button
                onClick={() => setViewMode("slider")}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
                  viewMode === "slider"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Sliders className="h-4 w-4" />
                Interactive Image Slider
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Display Mode */}
        {viewMode === "cards" ? (
          /* Side-by-Side Cards View */
          <div className="mt-14 grid grid-cols-1 gap-8 lg:grid-cols-2 items-stretch">
            {/* The Problem (Without Nyumba.ke) */}
            <div className="group relative flex flex-col justify-between rounded-3xl border border-destructive/30 bg-destructive/[0.03] dark:bg-destructive/10 p-6 sm:p-8 transition-all hover:border-destructive/50 hover:shadow-xl hover:shadow-destructive/5">
              <div className="space-y-6">
                {/* Header Badge */}
                <div className="flex items-center justify-between border-b border-destructive/20 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-destructive/10 p-2.5 text-destructive">
                      <AlertTriangle className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-destructive">
                        Without Nyumba.ke
                      </h3>
                      <p className="text-xs text-destructive/80 font-medium">
                        The Traditional Broker Nightmare
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-destructive/15 px-3 py-1 text-xs font-semibold text-destructive border border-destructive/20">
                    High Scam Risk
                  </span>
                </div>

                {/* Problem Image Visual */}
                <div className="relative overflow-hidden rounded-2xl border border-destructive/20 shadow-md">
                  <div className="relative aspect-square w-full">
                    <Image
                      src="/without-nyumba.png"
                      alt="Traditional house hunting problems and scams"
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3 text-white text-xs font-medium bg-black/70 backdrop-blur-md p-2.5 rounded-xl border border-white/10">
                       &quot;Paid KSh 2,500 viewing fee, then the agent turned off their phone!&quot;
                    </div>
                  </div>
                </div>

                {/* Bullet Points */}
                <ul className="space-y-4">
                  {WITHOUT_POINTS.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3.5">
                      <div className="mt-0.5 rounded-full bg-destructive/10 p-1 text-destructive shrink-0">
                        <XCircle className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-foreground">
                          {item.title}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                          {item.desc}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Loss Summary Box */}
              <div className="mt-8 rounded-2xl bg-destructive/10 border border-destructive/20 p-4 text-center">
                <p className="text-xs font-semibold text-destructive">
                   Average Victim Loss: <span className="font-bold text-sm">KSh 7,500+</span> in viewing fees & weeks of wasted effort.
                </p>
              </div>
            </div>

            {/* The Solution (With Nyumba.ke) */}
            <div className="group relative flex flex-col justify-between rounded-3xl border border-emerald-500/40 bg-emerald-500/[0.03] dark:bg-emerald-950/20 p-6 sm:p-8 transition-all hover:border-emerald-500/60 hover:shadow-xl hover:shadow-emerald-500/10">
              <div className="space-y-6">
                {/* Header Badge */}
                <div className="flex items-center justify-between border-b border-emerald-500/20 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-600 dark:text-emerald-400">
                      <ShieldCheck className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                        With Nyumba.ke ✓
                      </h3>
                      <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80 font-medium">
                        100% Verified Direct Platform
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                     Verified & Safe
                  </span>
                </div>

                {/* Solution Image Visual */}
                <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 shadow-md">
                  <div className="relative aspect-square w-full">
                    <Image
                      src="/with-nyumba.png"
                      alt="Verified seamless house hunting with Nyumba.ke"
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3 text-white text-xs font-medium bg-black/70 backdrop-blur-md p-2.5 rounded-xl border border-white/10">
                       &quot;Found my dream 2-bedroom in Kilimani with zero agent fees and accurate GPS!&quot;
                    </div>
                  </div>
                </div>

                {/* Bullet Points */}
                <ul className="space-y-4">
                  {WITH_POINTS.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3.5">
                      <div className="mt-0.5 rounded-full bg-emerald-500/10 p-1 text-emerald-600 dark:text-emerald-400 shrink-0">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-foreground">
                          {item.title}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                          {item.desc}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Savings Summary Box */}
              <div className="mt-8 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-center">
                <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                   Total Savings: <span className="font-bold text-sm">Save KSh 10,000+</span> in viewing fees & rent direct from landlords.
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* Interactive Split Image Comparison Slider */
          <div className="mt-10 max-w-2xl mx-auto space-y-4">
            {/* Header Status Bar */}
            <div className="flex items-center justify-between px-2 text-xs sm:text-sm font-bold">
              <div className="flex items-center gap-2 text-destructive bg-destructive/10 border border-destructive/20 px-3.5 py-1.5 rounded-xl">
                <XCircle className="h-4 w-4 shrink-0" />
                <span>Without Nyumba.ke</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1.5 rounded-xl">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>With Nyumba.ke</span>
              </div>
            </div>

            <div className="text-center text-xs text-muted-foreground flex items-center justify-center gap-2 pt-1">
              <Eye className="h-4 w-4 text-primary" /> Drag the divider left or right to compare
            </div>

            {/* Slider Container - Exact 1:1 Aspect Ratio matching the 1024x1024 images */}
            <div
              ref={sliderRef}
              onMouseDown={(e) => {
                setIsDragging(true);
                handleMove(e.clientX);
              }}
              onTouchStart={(e) => {
                setIsDragging(true);
                handleMove(e.touches[0].clientX);
              }}
              className="relative w-full aspect-square select-none overflow-hidden rounded-3xl border border-border shadow-2xl cursor-ew-resize bg-black"
            >
              {/* Background: With Nyumba.ke */}
              <div className="absolute inset-0 w-full h-full">
                <Image
                  src="/with-nyumba.png"
                  alt="With Nyumba.ke verified solution"
                  fill
                  className="object-cover"
                  priority
                />
                <div className="absolute bottom-4 right-4 z-10 flex items-center gap-2 rounded-xl bg-emerald-600/95 px-4 py-2 text-sm font-bold text-white backdrop-blur-md shadow-lg">
                  <CheckCircle2 className="h-4 w-4" /> With Nyumba.ke ✓
                </div>
              </div>

              {/* Foreground: Without Nyumba.ke with Clip-Path — badge clips with image */}
              <div
                className="absolute inset-0 w-full h-full z-10"
                style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
              >
                <Image
                  src="/without-nyumba.png"
                  alt="Without Nyumba.ke traditional problem"
                  fill
                  className="object-cover"
                  priority
                />
                <div className="absolute bottom-4 left-4 z-10 flex items-center gap-2 rounded-xl bg-destructive/95 px-4 py-2 text-sm font-bold text-white backdrop-blur-md shadow-lg">
                  <XCircle className="h-4 w-4" /> Without Nyumba.ke ✗
                </div>
              </div>

              {/* Slider Divider Line & Drag Handle */}
              <div
                className="absolute inset-y-0 z-20 w-1 bg-white shadow-[0_0_15px_rgba(0,0,0,0.6)]"
                style={{ left: `${sliderPos}%` }}
              >
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full border-2 border-white bg-primary text-primary-foreground shadow-2xl ring-4 ring-black/40">
                  <Sliders className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* High-Impact Comparison Metric Cards */}
        <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {COMPARISON_METRICS.map((metric, idx) => {
            const Icon = metric.icon;
            return (
              <div
                key={idx}
                className="rounded-2xl border border-border bg-card p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h4 className="text-sm font-bold text-foreground">
                    {metric.label}
                  </h4>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Traditional:</span>
                    <span className="font-semibold text-destructive line-through">
                      {metric.withoutVal}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Nyumba.ke:</span>
                    <span className={`font-bold px-2 py-0.5 rounded border ${metric.badgeColor}`}>
                      {metric.withVal}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA Footer */}
        <div className="mt-16 rounded-3xl bg-gradient-to-r from-primary/10 via-primary/5 to-secondary/10 border border-primary/20 p-8 sm:p-10 text-center space-y-6">
          <h3 className="text-2xl font-bold tracking-tight sm:text-3xl text-foreground">
            Experience 100% Scam-Free House Hunting in Nairobi
          </h3>
          <p className="max-w-xl mx-auto text-sm sm:text-base text-muted-foreground">
            No agents demanding viewing fees. No fake locations. Just real homes from verified property owners.
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/browse"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all hover:scale-[1.02]"
            >
              Browse Verified Listings <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/register?role=LANDLORD"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-6 py-3.5 text-sm font-semibold text-foreground hover:bg-accent transition-all"
            >
              List Your Property Free <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
