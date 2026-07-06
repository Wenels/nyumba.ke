import { ShieldCheck } from "lucide-react";
import Link from "next/link";

export function LandlordCta() {
  return (
    <section className="bg-gradient-to-br from-secondary to-secondary/70 px-6 py-20 text-secondary-foreground">
      <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
        <ShieldCheck className="h-9 w-9 text-secondary-foreground/80" />
        <h2 className="mt-4 text-3xl font-bold tracking-tight">
          Are you a landlord?
        </h2>
        <p className="mt-3 text-secondary-foreground/90">
          List your vacant property for free. Pin the exact location. Reach
          thousands of tenants directly — no agent fees.
        </p>

        <div className="mt-8 flex items-center gap-6">
          <Link
            href="/register?role=landlord"
            className="rounded-md bg-background px-6 py-3 font-medium text-secondary hover:bg-background/90 transition-colors"
          >
            List for free
          </Link>
          <Link
            href="/browse"
            className="font-medium underline underline-offset-4 hover:no-underline"
          >
            Browse listings
          </Link>
        </div>
      </div>
    </section>
  );
}
