import { Navbar } from "@/app/features/landing-page/components/navbar";
import { Footer } from "@/app/features/landing-page/components/footer";
import { Hero } from "@/app/features/landing-page/components/hero";
import { StatsBar } from "@/app/features/landing-page/components/stats-bar";
import { HowItWorks } from "@/app/features/landing-page/components/how-it-works";
import { Comparison } from "@/app/features/landing-page/components/comparison";
import { MapPreview } from "@/app/features/landing-page/components/map-preview";
import { LatestListings } from "@/app/features/landing-page/components/latest-listings";
import { Testimonials } from "@/app/features/landing-page/components/testimonials";
import { LandlordCta } from "@/app/features/landing-page/components/landlord-cta";

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main className="flex min-h-screen flex-col">
      <Hero />
      <StatsBar />
      <HowItWorks />
      <Comparison />
      <MapPreview />
      <LatestListings />
      <Testimonials />
      <LandlordCta />
      </main>
      <Footer />
    </>
  );
}
