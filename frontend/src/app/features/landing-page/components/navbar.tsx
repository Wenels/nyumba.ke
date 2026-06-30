import Link from "next/link";
import { Home } from "lucide-react";

export function Navbar() {
  return (
    <header className="border-b border-border bg-background">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary">
            <Home className="h-5 w-5 text-secondary-foreground" />
          </span>
          <span className="text-lg font-bold">
            nyumba<span className="text-secondary">.ke</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm font-medium text-foreground sm:flex">
          <Link href="/browse" className="hover:text-secondary">
            Browse
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-medium hover:text-secondary">
            Log in
          </Link>
          <Link
            href="/register"
            className="rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground hover:bg-secondary/90 transition-colors"
          >
            Get started
          </Link>
        </div>
      </div>
    </header>
  );
}
