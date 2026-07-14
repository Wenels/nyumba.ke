import { Home, X } from "lucide-react";
import Link from "next/link";

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
            <Link href="/" className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary">
                <Home className="h-5 w-5 text-secondary-foreground" />
              </span>
              <span className="text-lg font-bold text-background">
                nyumba<span className="text-secondary">.ke</span>
              </span>
            </Link>
            
            
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
