"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/app/features/landing-page/components/navbar";
import { Footer } from "@/app/features/landing-page/components/footer";
import { Hero } from "@/app/features/landing-page/components/hero";
import { StatsBar } from "@/app/features/landing-page/components/stats-bar";
import { Comparison } from "@/app/features/landing-page/components/comparison";
import { MapPreview } from "@/app/features/landing-page/components/map-preview";
import { LatestListings } from "@/app/features/landing-page/components/latest-listings";
import { Testimonials } from "@/app/features/landing-page/components/testimonials";
import { LandlordCta } from "@/app/features/landing-page/components/landlord-cta";
import { ProductTour, ProductTourTrigger } from "@/components/ui/product-tour";

export default function HomePage() {
  const [tourOpen, setTourOpen] = useState(false);

  // Auto open tour on 1st visit
  useEffect(() => {
    const hasSeenTour = localStorage.getItem("nyumba_tour_seen");
    if (!hasSeenTour) {
      const timer = setTimeout(() => {
        setTourOpen(true);
        localStorage.setItem("nyumba_tour_seen", "true");
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <>
      <Navbar />
      <main className="flex min-h-screen flex-col">
        <Hero />
        <StatsBar />
        <Comparison />
        <MapPreview />
        <LatestListings />
        <Testimonials />
        <LandlordCta />
      </main>
      <Footer />

      {/* Interactive Platform Product Tour */}
      <ProductTour isOpen={tourOpen} onClose={() => setTourOpen(false)} />
      <ProductTourTrigger onClick={() => setTourOpen(true)} />
    </>
  );
}
