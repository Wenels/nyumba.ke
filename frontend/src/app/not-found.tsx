import Link from "next/link";
import { Home, SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <SearchX className="h-16 w-16 text-muted-foreground" />
      <h1 className="mt-6 text-4xl font-bold tracking-tight">404</h1>
      <p className="mt-2 text-xl font-semibold">Page not found</p>
      <p className="mt-3 max-w-sm text-muted-foreground">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <div className="mt-8 flex items-center gap-4">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-lg bg-secondary px-5 py-2.5 text-sm font-semibold text-secondary-foreground hover:bg-secondary/90 transition-colors"
        >
          <Home className="h-4 w-4" />
          Go home
        </Link>
        <Link
          href="/browse"
          className="rounded-lg border border-border px-5 py-2.5 text-sm font-semibold hover:border-secondary hover:text-secondary transition-colors"
        >
          Browse listings
        </Link>
      </div>
    </div>
  );
}

