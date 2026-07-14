import Link from "next/link";

export function LandlordCta() {
  return (
    <section className="px-6 py-20">
      <div className="mx-auto max-w-4xl overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/80 to-secondary p-12 text-center text-primary-foreground">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Start your search today.
        </h2>
        <p className="mt-3 text-primary-foreground/80 max-w-xl mx-auto">
          Join thousands of tenants who found their perfect home through our
          verified platform. Safe, fast, and transparent.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/map"
            className="flex items-center gap-2 rounded-lg bg-background px-6 py-3 font-semibold text-primary hover:bg-background/90 transition-colors"
          >
            Explore the Map
          </Link>
          <Link
            href="/register"
            className="flex items-center gap-2 rounded-lg border border-primary-foreground/30 bg-primary-foreground/10 px-6 py-3 font-semibold text-primary-foreground hover:bg-primary-foreground/20 transition-colors"
          >
            Create Free Account →
          </Link>
        </div>

        <p className="mt-6 text-sm text-primary-foreground/60">
          Are you a landlord?{" "}
          <Link
            href="/register?role=LANDLORD"
            className="font-semibold text-primary-foreground underline underline-offset-2 hover:no-underline"
          >
            List your property for free
          </Link>
        </p>
      </div>
    </section>
  );
}