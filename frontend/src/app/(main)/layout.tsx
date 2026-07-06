import type React from "react";
import { SafetyBanner } from "@/app/features/landing-page/components/safety-banner";
import { Navbar } from "@/app/features/landing-page/components/navbar";
import { Footer } from "@/app/features/landing-page/components/footer";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <SafetyBanner />
      <Navbar />
      <div className="flex-1">{children}</div>
      <Footer />
    </div>
  );
}
