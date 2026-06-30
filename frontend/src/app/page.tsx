import { SafetyBanner } from "@/app/features/landing-page/components/safety-banner";
import { Navbar } from "@/app/features/landing-page/components/navbar";
import { Hero } from "@/app/features/landing-page/components/hero";
import { StatsBar } from "@/app/features/landing-page/components/stats-bar";
import { HowItWorks } from "@/app/features/landing-page/components/how-it-works";
import { LatestListings } from "@/app/features/landing-page/components/latest-listings";
import { LandlordCta } from "@/app/features/landing-page/components/landlord-cta";
import { Footer } from "@/app/features/landing-page/components/footer";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col">
      <SafetyBanner />
      <Navbar />
      <Hero />
      <StatsBar />
      <HowItWorks />
      <LatestListings />
      <LandlordCta />
      <Footer />
    </main>
  );
}
