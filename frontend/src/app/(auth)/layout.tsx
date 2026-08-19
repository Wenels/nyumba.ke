"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import { ShieldCheck, MessageSquare, BadgePercent, ArrowLeft, Building2, UserCheck } from "lucide-react";

function AuthLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const roleParam = searchParams.get("role")?.toUpperCase();
  const isLandlord = roleParam === "LANDLORD";

  // Select individual background photo for each auth page
  let bgImage = "/tenant-register-bg.jpg";
  if (isLandlord) {
    if (pathname?.includes("/register")) {
      bgImage = "/landlord-register-bg.jpg"; // Night city skyline photo
    } else {
      bgImage = "/landlord-login-bg.jpg"; // Real estate house model & key photo
    }
  } else {
    if (pathname?.includes("/register")) {
      bgImage = "/tenant-register-bg.jpg"; // Cozy modern apartment living room photo
    } else {
      bgImage = "/tenant-login-bg.jpg"; // Modern apartment home interior photo
    }
  }

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-12 bg-background relative">
      {/* Back to Home Button for all screens */}
      <div className="absolute top-6 left-6 z-30">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-black/40 backdrop-blur-md px-3.5 py-2 text-xs font-bold text-white hover:bg-black/60 transition-all shadow-md"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Home</span>
        </Link>
      </div>

      {/* Left side: pure signature green (bg-primary) branding panel on desktop */}
      <div className="relative hidden lg:flex lg:col-span-5 flex-col justify-between bg-primary p-12 text-primary-foreground overflow-hidden">
        {/* Green gradient & glow accents */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-primary/95" />
        <div className="absolute -top-40 -left-40 h-80 w-80 rounded-full bg-secondary/15 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-80 w-80 rounded-full bg-secondary/20 blur-3xl" />

        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-2.5 w-fit">
            <Image
              src="/logo.svg"
              alt="Nyumba.ke Logo"
              width={40}
              height={40}
              className="rounded-xl object-contain"
            />
            <span className="text-xl font-bold tracking-tight text-white">
              nyumba<span className="text-secondary">.ke</span>
            </span>
          </Link>
        </div>

        <div className="relative z-10 my-auto max-w-md space-y-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-secondary border border-white/15">
              {isLandlord ? (
                <>
                  <Building2 className="h-3.5 w-3.5" /> Landlord Portal & Management
                </>
              ) : (
                <>
                  <UserCheck className="h-3.5 w-3.5" /> Verified Rental Marketplace
                </>
              )}
            </div>

            <h2 className="text-3xl font-bold tracking-tight text-white leading-tight">
              {isLandlord
                ? "List & manage your properties effortlessly across Kenya."
                : "The easiest way to find and book rentals in Kenya."}
            </h2>
            <p className="text-primary-foreground/85 text-sm leading-relaxed font-medium">
              {isLandlord
                ? "Reach thousands of verified tenants directly. Zero agent commissions, zero hassle."
                : "Connect directly with verified landlords and tenants. Zero middleman commission, zero hassle."}
            </p>
          </div>

          <div className="space-y-5">
            <div className="flex items-start gap-3.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 mt-0.5 border border-white/10">
                <ShieldCheck className="h-5 w-5 text-secondary" />
              </span>
              <div>
                <h4 className="font-bold text-white text-sm">Verified Listings & Landlords</h4>
                <p className="text-xs text-primary-foreground/75 mt-0.5">
                  Every house and landlord profile is verified to ensure safe transactions.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 mt-0.5 border border-white/10">
                <MessageSquare className="h-5 w-5 text-secondary" />
              </span>
              <div>
                <h4 className="font-bold text-white text-sm">Direct In-App Messaging</h4>
                <p className="text-xs text-primary-foreground/75 mt-0.5">
                  Chat directly with landlords or tenants to negotiate terms & schedule viewings.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 mt-0.5 border border-white/10">
                <BadgePercent className="h-5 w-5 text-secondary" />
              </span>
              <div>
                <h4 className="font-bold text-white text-sm">Zero Agent Fees</h4>
                <p className="text-xs text-primary-foreground/75 mt-0.5">
                  Landlords list properties for free. Tenants pay exact listed rent.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs font-medium text-primary-foreground/60 border-t border-white/10 pt-6">
          &copy; {new Date().getFullYear()} Nyumba.ke. Built for Kenya.
        </div>
      </div>

      {/* Right side: Photo background for the form area (instead of whitish background) */}
      <div className="relative lg:col-span-7 flex flex-col justify-center items-center px-4 py-16 sm:px-6 lg:px-8 bg-slate-950 overflow-hidden">
        {/* Dynamic matching photo background on the form side */}
        <Image
          key={bgImage}
          src={bgImage}
          alt="Auth background"
          fill
          priority
          quality={90}
          className="object-cover object-center"
        />

        {/* Dark overlay for contrast over photo */}
        <div className="absolute inset-0 bg-slate-950/65 backdrop-blur-[2px]" />

        {/* Mobile Header */}
        <div className="relative z-10 lg:hidden mb-6 mt-10">
          <Link href="/" className="flex items-center gap-2.5">
            <Image
              src="/logo.svg"
              alt="Nyumba.ke Logo"
              width={36}
              height={36}
              className="rounded-lg object-contain"
            />
            <span className="text-lg font-bold text-white">
              nyumba<span className="text-secondary">.ke</span>
            </span>
          </Link>
        </div>

        {/* Centered Form Card over photo */}
        <div className="relative z-10 w-full max-w-md my-6">
          {children}
        </div>
      </div>
    </div>
  );
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950" />}>
      <AuthLayoutContent>{children}</AuthLayoutContent>
    </Suspense>
  );
}
