"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  LayoutDashboard,
  ListChecks,
  Users,
  Flag,
  ShieldCheck,
  LogOut,
  Home,
} from "lucide-react";
import { useAuth } from "@/app/features/auth/hooks/use-auth";

const NAV_ITEMS = [
  { href: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/admin/listings", icon: ListChecks, label: "Listings" },
  { href: "/admin/users", icon: Users, label: "Users" },
  { href: "/admin/reports", icon: Flag, label: "Reports" },
  { href: "/admin/verifications", icon: ShieldCheck, label: "Verifications" },
];

export default function AdminLayout({
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
        if (pathname !== "/admin/login") {
          router.push("/admin/login");
        }
      } else if (!user.isAdmin) {
        if (pathname !== "/admin/login") {
          router.push("/");
        }
      } else if (pathname === "/admin/login") {
        router.push("/admin/dashboard");
      }
    }
  }, [isLoading, user, router, pathname]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-foreground">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-background" />
      </div>
    );
  }

  // Show login page without sidebar
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  if (!user?.isAdmin) return null;

  return (
    <div className="flex min-h-screen bg-foreground text-background">
      {/* Sidebar */}
      <aside className="hidden w-60 shrink-0 border-r border-background/10 lg:flex lg:flex-col">
        {/* Logo */}
        <div className="border-b border-background/10 px-6 py-5">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary">
              <Home className="h-4 w-4 text-secondary-foreground" />
            </span>
            <span className="font-bold text-background">
              nyumba<span className="text-secondary">.ke</span>
              <span className="ml-1.5 rounded bg-secondary/20 px-1.5 py-0.5 text-xs text-secondary">
                admin
              </span>
            </span>
          </Link>
        </div>

        {/* User */}
        <div className="border-b border-background/10 px-6 py-4">
          <p className="text-sm font-semibold text-background truncate">
            {user.fullName}
          </p>
          <p className="text-xs text-background/50 truncate">{user.email}</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-background/10 text-background"
                    : "text-background/50 hover:bg-background/5 hover:text-background"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="border-t border-background/10 px-3 py-4">
          <button
            onClick={() => logout()}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-background/50 hover:bg-background/5 hover:text-destructive transition-colors"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Log out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto px-6 py-8 max-w-6xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
