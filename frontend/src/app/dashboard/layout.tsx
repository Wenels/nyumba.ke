"use client";

import "leaflet/dist/leaflet.css";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";
import {
  LayoutDashboard,
  ListChecks,
  PlusCircle,
  ShieldCheck,
  UserCircle,
  LogOut,
  Home,
} from "lucide-react";
import { useAuth } from "@/app/features/auth/hooks/use-auth";

const NAV_ITEMS = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Overview" },
  { href: "/dashboard/listings", icon: ListChecks, label: "My Listings" },
  { href: "/dashboard/post", icon: PlusCircle, label: "Post Listing" },
  { href: "/dashboard/verification", icon: ShieldCheck, label: "Verification" },
  { href: "/dashboard/profile", icon: UserCircle, label: "Profile" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push("/login");
      } else if (user.role !== "LANDLORD" && user.role !== "ADMIN") {
        toast.error("Access denied", {
          description: "Only landlords can access the dashboard.",
        });
        router.push("/");
      }
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user || (user.role !== "LANDLORD" && user.role !== "ADMIN")) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-muted/30">
      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-border bg-background lg:flex lg:flex-col">
        {/* Logo */}
        <div className="border-b border-border px-6 py-5">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary">
              <Home className="h-4 w-4 text-secondary-foreground" />
            </span>
            <span className="font-bold">
              nyumba<span className="text-secondary">.ke</span>
            </span>
          </Link>
        </div>

        {/* User info */}
        <div className="border-b border-border px-6 py-4">
          <p className="text-sm font-semibold truncate">{user?.fullName}</p>
          <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          <span className="mt-1.5 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary capitalize">
            {user?.role.toLowerCase()}
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
            const active =
              href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-secondary/10 text-secondary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="border-t border-border px-3 py-4">
          <button
            onClick={() => logout()}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-destructive transition-colors"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Log out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col">
        {/* Mobile header */}
        <header className="flex items-center justify-between border-b border-border bg-background px-6 py-4 lg:hidden">
          <Link href="/" className="flex items-center gap-2 font-bold">
            nyumba<span className="text-secondary">.ke</span>
          </Link>
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Home
          </Link>
        </header>

        <main className="flex-1 px-6 py-8 max-w-5xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
