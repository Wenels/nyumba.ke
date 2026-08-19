import { X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

const AREAS = [
  "Westlands",
  "Kilimani",
  "Karen",
  "Lavington",
  "Kasarani",
  "Roysambu",
];

const PLATFORM_LINKS = [
  { label: "Get started", href: "/register" },
  { label: "List your house", href: "/register?role=landlord" },
  { label: "Browse homes", href: "/browse" },
  { label: "Sign in", href: "/login" },
];

export function Footer() {
  return (
    <footer className="bg-foreground px-6 py-16 text-background">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-[1.5fr_1fr_1fr]">
          <div>
            <Link href="/" className="flex items-center gap-2.5">
              <Image
                src="/logo.svg"
                alt="Nyumba.ke"
                width={36}
                height={36}
                className="rounded-lg shrink-0 object-contain"
              />
              <span className="text-lg font-bold text-background">
                nyumba<span className="text-secondary">.ke</span>
              </span>
            </Link>
            <p className="mt-3 text-xs text-background/70 max-w-sm leading-relaxed">
              Kenya&apos;s complete digital tenancy ecosystem. Streamlining property discovery, contracts, and M-Pesa STK rent payments.
            </p>
          </div>

          <div className="space-y-3 text-xs">
            <p className="font-bold uppercase tracking-wider text-secondary">Quick Links</p>
            <ul className="space-y-2 text-background/80">
              <li><Link href="/browse" className="hover:text-white transition-colors">Browse Properties</Link></li>
              <li><Link href="/how-it-works" className="hover:text-white transition-colors">How It Works</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
              <li><Link href="/register?role=LANDLORD" className="hover:text-white transition-colors">List Your Property</Link></li>
            </ul>
          </div>

          <div className="space-y-3 text-xs">
            <p className="font-bold uppercase tracking-wider text-secondary">Popular Areas</p>
            <ul className="space-y-2 text-background/80">
              {AREAS.map((area) => (
                <li key={area}>
                  <Link href={`/browse?area=${encodeURIComponent(area)}`} className="hover:text-white transition-colors">
                    {area}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-background/10 pt-6 text-sm text-background/50 sm:flex-row sm:items-center sm:justify-between">
          <span>
            &copy; {new Date().getFullYear()} Nyumba.ke. Built for Kenya.
          </span>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-secondary">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-secondary">
              Terms
            </Link>
            <Link href="/contact" className="hover:text-secondary">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
