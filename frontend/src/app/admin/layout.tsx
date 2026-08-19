"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  ListChecks,
  Users,
  Flag,
  ShieldCheck,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "@/app/features/auth/hooks/use-auth";

const NAV_ITEMS = [
  { href: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/admin/listings", icon: ListChecks, label: "Listings" },
  { href: "/admin/users", icon: Users, label: "Users" },
  { href: "/admin/reports", icon: Flag, label: "Reports" },
  { href: "/admin/verifications", icon: ShieldCheck, label: "Verifications" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      if (!user) router.push("/admin/login");
      else if (!user.isAdmin) router.push("/");
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-foreground">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-background" />
      </div>
    );
  }

  if (pathname === "/admin/login") return <>{children}</>;
  if (!user?.isAdmin) return null;

  const NavLinks = () => (
    <>
      {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={() => setMobileOpen(false)}
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
    </>
  );

  return (
    <div className="flex min-h-screen bg-foreground text-background">
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 border-r border-background/10 lg:flex lg:flex-col">
        <div className="border-b border-background/10 px-6 py-5">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.svg" alt="Nyumba.ke" width={32} height={32} className="rounded-lg" />
            <span className="font-bold text-background">
              nyumba<span className="text-secondary">.ke</span>
              <span className="ml-1.5 rounded bg-secondary/20 px-1.5 py-0.5 text-xs text-secondary">admin</span>
            </span>
          </Link>
        </div>
        <div className="border-b border-background/10 px-6 py-4">
          <p className="text-sm font-semibold text-background truncate">{user.fullName}</p>
          <p className="text-xs text-background/50 truncate">{user.email}</p>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          <NavLinks />
        </nav>
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

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/80 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-y-0 left-0 z-50 w-64 bg-foreground border-r border-background/10 flex flex-col lg:hidden">
          <div className="flex items-center justify-between border-b border-background/10 px-6 py-5">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/logo.svg" alt="Nyumba.ke" width={28} height={28} className="rounded-lg" />
              <span className="font-bold text-background text-sm">nyumba<span className="text-secondary">.ke</span></span>
            </Link>
            <button onClick={() => setMobileOpen(false)}>
              <X className="h-5 w-5 text-background/50" />
            </button>
          </div>
          <nav className="flex-1 space-y-1 px-3 py-4">
            <NavLinks />
          </nav>
          <div className="border-t border-background/10 px-3 py-4">
            <button
              onClick={() => { logout(); setMobileOpen(false); }}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-background/50 hover:text-destructive transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Log out
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-1 flex-col min-w-0">
        {/* Mobile topbar */}
        <header className="flex items-center justify-between border-b border-background/10 px-6 py-4 lg:hidden">
          <button
            onClick={() => setMobileOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-background/20"
          >
            <Menu className="h-5 w-5 text-background" />
          </button>
          <span className="font-bold text-background text-sm">
            nyumba<span className="text-secondary">.ke</span>
            <span className="ml-1.5 rounded bg-secondary/20 px-1.5 py-0.5 text-xs text-secondary">admin</span>
          </span>
          <div className="w-9" />
        </header>

        <main className="flex-1 overflow-auto px-6 py-8 max-w-6xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
