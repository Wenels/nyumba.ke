"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Menu, X, Home, LogOut, LayoutDashboard, Heart, MessageSquare } from "lucide-react";
import { useAuth } from "@/app/features/auth/hooks/use-auth";

export function Navbar() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();

  return (
    <header className="border-b border-border bg-background sticky top-0 z-50">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.png" alt="Nyumba.ke" width={32} height={32} className="rounded-lg" />
          <span className="text-lg font-bold">
            nyumba<span className="text-secondary">.ke</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-8 text-sm font-medium sm:flex">
          <Link href="/browse" className="hover:text-secondary transition-colors">Browse</Link>
          {user && (
            <>
              <Link href="/saved" className="hover:text-secondary transition-colors">Saved</Link>
              <Link href="/inbox" className="hover:text-secondary transition-colors">Inbox</Link>
            </>
          )}
        </nav>

        {/* Desktop auth */}
        <div className="hidden items-center gap-4 sm:flex">
          {user ? (
            <>
              <Link
                href="/dashboard"
                className="flex items-center gap-1.5 text-sm font-medium hover:text-secondary transition-colors"
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Link>
              <button
                onClick={() => logout()}
                className="flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm font-medium hover:border-secondary hover:text-secondary transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Log out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm font-medium hover:text-secondary transition-colors">
                Log in
              </Link>
              <Link
                href="/register"
                className="rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground hover:bg-secondary/90 transition-colors"
              >
                Get started
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setOpen(!open)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border sm:hidden"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-border bg-background px-6 py-4 sm:hidden">
          <nav className="flex flex-col gap-1">
            <Link
              href="/browse"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium hover:bg-muted transition-colors"
            >
              <Home className="h-4 w-4" />
              Browse listings
            </Link>
            {user && (
              <>
                <Link
                  href="/saved"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium hover:bg-muted transition-colors"
                >
                  <Heart className="h-4 w-4" />
                  Saved
                </Link>
                <Link
                  href="/inbox"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium hover:bg-muted transition-colors"
                >
                  <MessageSquare className="h-4 w-4" />
                  Inbox
                </Link>
                <Link
                  href="/dashboard"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium hover:bg-muted transition-colors"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Link>
                <button
                  onClick={() => { logout(); setOpen(false); }}
                  className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-destructive hover:bg-muted transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Log out
                </button>
              </>
            )}
            {!user && (
              <>
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium hover:bg-muted transition-colors"
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  onClick={() => setOpen(false)}
                  className="mt-2 flex items-center justify-center rounded-lg bg-secondary px-4 py-3 text-sm font-medium text-secondary-foreground hover:bg-secondary/90 transition-colors"
                >
                  Get started
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
