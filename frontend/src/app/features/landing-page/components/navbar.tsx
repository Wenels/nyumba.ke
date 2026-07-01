"use client";

import { Home, LogOut, User as UserIcon } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/app/features/auth/hooks/use-auth";

export function Navbar() {
  const { user, isLoading, logout } = useAuth();

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
          {user && (
            <Link href="/dashboard" className="hover:text-secondary">
              Dashboard
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-4">
          {isLoading ? (
            <div className="h-8 w-20 animate-pulse rounded bg-muted" />
          ) : user ? (
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                <UserIcon className="h-4 w-4" />
                <span>{user.fullName}</span>
              </span>
              <button
                type="button"
                onClick={() => logout()}
                className="flex items-center gap-1 text-sm font-medium text-destructive hover:underline cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                <span>Log out</span>
              </button>
            </div>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-medium hover:text-secondary"
              >
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
      </div>
    </header>
  );
}
