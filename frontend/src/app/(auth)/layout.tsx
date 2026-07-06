import type React from "react";
import Link from "next/link";
import { Home, ShieldCheck, MessageSquare, BadgePercent, ArrowLeft } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-12 bg-background relative">
      {/* Back to Home Button for all screens */}
      <div className="absolute top-6 left-6 z-20">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium shadow-sm hover:bg-muted transition-colors text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Home</span>
        </Link>
      </div>

      {/* Left side: branding/visuals - hidden on mobile/tablet */}
      <div className="relative hidden lg:flex lg:col-span-5 flex-col justify-between bg-primary p-12 text-primary-foreground overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-primary/95" />
        <div className="absolute -top-40 -left-40 h-80 w-80 rounded-full bg-secondary/15 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-80 w-80 rounded-full bg-secondary/20 blur-3xl" />

        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-2 w-fit">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary">
              <Home className="h-5 w-5 text-secondary-foreground" />
            </span>
            <span className="text-xl font-bold tracking-tight text-white">
              nyumba<span className="text-secondary">.ke</span>
            </span>
          </Link>
        </div>

        <div className="relative z-10 my-auto max-w-md space-y-8">
          <div className="space-y-4">
            <h2 className="text-3xl font-bold tracking-tight text-white leading-tight">
              The easiest way to find and list rentals in Kenya.
            </h2>
            <p className="text-primary-foreground/80 text-base leading-relaxed">
              Connect directly with verified landlords and tenants. Zero middleman commission, zero hassle.
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 mt-1">
                <ShieldCheck className="h-5 w-5 text-secondary" />
              </span>
              <div>
                <h4 className="font-semibold text-white">Verified Listings</h4>
                <p className="text-sm text-primary-foreground/75 mt-0.5">
                  Every house and landlord profile is verified to prevent fraud.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 mt-1">
                <MessageSquare className="h-5 w-5 text-secondary" />
              </span>
              <div>
                <h4 className="font-semibold text-white">Direct Communication</h4>
                <p className="text-sm text-primary-foreground/75 mt-0.5">
                  Call or chat directly with landlords to negotiate and ask questions.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 mt-1">
                <BadgePercent className="h-5 w-5 text-secondary" />
              </span>
              <div>
                <h4 className="font-semibold text-white">No Agent Fees</h4>
                <p className="text-sm text-primary-foreground/75 mt-0.5">
                  Landlords list for free. Tenants pay exactly what the rent is.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs text-primary-foreground/60 border-t border-white/10 pt-6">
          &copy; {new Date().getFullYear()} Nyumba.ke. All rights reserved.
        </div>
      </div>

      {/* Right side: form content */}
      <div className="lg:col-span-7 flex flex-col justify-center items-center px-4 py-20 sm:px-6 lg:px-8 bg-background">
        {/* Mobile Header: only shown on smaller screens */}
        <div className="lg:hidden mb-8">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary">
              <Home className="h-5 w-5 text-secondary-foreground" />
            </span>
            <span className="text-lg font-bold">
              nyumba<span className="text-secondary">.ke</span>
            </span>
          </Link>
        </div>

        <div className="w-full max-w-lg">
          {children}
        </div>
      </div>
    </div>
  );
}
