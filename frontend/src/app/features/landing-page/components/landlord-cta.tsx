import Link from "next/link";
import { Building2, Search } from "lucide-react";

export function LandlordCta() {
  return (
    <section data-tour="landlord-cta" className="px-6 py-20">
      <div className="mx-auto max-w-4xl overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary/85 to-secondary p-10 sm:p-14 text-center text-primary-foreground shadow-2xl">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Ready to find your next home or list a property?
        </h2>
        <p className="mt-3 text-primary-foreground/90 max-w-xl mx-auto text-sm sm:text-base leading-relaxed">
          Join thousands of verified tenants and property owners on Kenya&apos;s direct rental platform. Safe, fast, and 0% agent commission.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/register?role=TENANT"
            className="flex items-center gap-2 rounded-xl bg-background px-6 py-3.5 font-bold text-primary hover:bg-background/90 transition-all shadow-lg text-sm"
          >
            <Search className="h-4 w-4" /> Find Your Home →
          </Link>
          <Link
            href="/register?role=LANDLORD"
            className="flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-6 py-3.5 font-bold text-white backdrop-blur-md hover:bg-white/20 transition-all text-sm"
          >
            <Building2 className="h-4 w-4 text-secondary" /> Register as Landlord →
          </Link>
        </div>

        <p className="mt-6 text-xs text-primary-foreground/75">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-bold text-white underline underline-offset-2 hover:no-underline"
          >
            Sign in here
          </Link>
        </p>
      </div>
    </section>
  );
}