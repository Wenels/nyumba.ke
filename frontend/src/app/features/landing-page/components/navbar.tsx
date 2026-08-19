"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { Menu, X, LogOut, Map, ChevronDown, Home, Building2 } from "lucide-react";
import { useAuth } from "@/app/features/auth/hooks/use-auth";

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, logout } = useAuth();
  const loginRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close login dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (loginRef.current && !loginRef.current.contains(e.target as Node)) {
        setLoginOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const headerClass = scrolled
    ? "bg-slate-950/95 backdrop-blur-md border-b border-slate-800/80 shadow-xl"
    : "bg-slate-950/90 backdrop-blur-md border-b border-slate-800/50 shadow-md";

  const textClass = "text-white/90 hover:text-white font-semibold";

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${headerClass}`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <Image
            src="/logo.svg"
            alt="Nyumba.ke"
            width={32}
            height={32}
            className="rounded-lg"
          />
          <span className="text-lg font-bold text-white transition-colors">
            nyumba<span className="text-secondary">.ke</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-8 text-sm font-medium sm:flex">
          <Link href="/browse" className={`transition-colors ${textClass}`}>
            Explore
          </Link>
          <Link href="/map" className={`transition-colors ${textClass}`}>
            Map
          </Link>
          <Link href="/how-it-works" className={`transition-colors ${textClass}`}>
            How It Works
          </Link>
          <Link href="/contact" className={`transition-colors ${textClass}`}>
            Contact Us
          </Link>
          <Link href="/register?role=LANDLORD" className={`transition-colors ${textClass}`}>
            List Your Property
          </Link>
        </nav>

        {/* Desktop auth */}
        <div className="hidden items-center gap-3 sm:flex">
          {user ? (
            <>
              <Link
                href={user.role === "ADMIN" ? "/admin/dashboard" : user.role === "LANDLORD" ? "/dashboard" : "/tenant"}
                className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Dashboard
              </Link>
              <button
                onClick={() => logout()}
                className="flex items-center gap-1.5 rounded-md border border-white/30 bg-white/10 px-3 py-2 text-sm font-medium text-white hover:bg-white/20 transition-colors backdrop-blur-sm"
              >
                <LogOut className="h-4 w-4" />
                Log out
              </button>
            </>
          ) : (
            <>
              {/* Find Your Home → tenant registration */}
              <Link
                href="/register?role=TENANT"
                className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Find Your Home
              </Link>

              {/* Login dropdown */}
              <div className="relative" ref={loginRef}>
                <button
                  onClick={() => setLoginOpen((v) => !v)}
                  className="flex items-center gap-1.5 rounded-md border border-white/30 bg-white/10 px-3 py-2 text-sm font-medium text-white hover:bg-white/20 transition-colors backdrop-blur-sm"
                >
                  Login
                  <ChevronDown
                    className={`h-3.5 w-3.5 opacity-70 transition-transform duration-200 ${
                      loginOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Dropdown panel */}
                {loginOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 overflow-hidden rounded-xl border border-white/10 bg-foreground shadow-2xl">
                    <Link
                      href="/login?role=LANDLORD"
                      onClick={() => setLoginOpen(false)}
                      className="flex items-center gap-3 px-4 py-3.5 text-sm font-medium text-white hover:bg-white/10 transition-colors border-b border-white/10"
                    >
                      <Building2 className="h-4 w-4 text-secondary shrink-0" />
                      For Landlords
                    </Link>
                    <Link
                      href="/login?role=TENANT"
                      onClick={() => setLoginOpen(false)}
                      className="flex items-center gap-3 px-4 py-3.5 text-sm font-medium text-white hover:bg-white/10 transition-colors"
                    >
                      <Home className="h-4 w-4 text-primary shrink-0" />
                      For Tenants
                    </Link>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setOpen(!open)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/30 bg-white/10 text-white sm:hidden"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-slate-800/80 bg-slate-950/98 px-6 py-4 backdrop-blur-md sm:hidden">
          <nav className="flex flex-col gap-1">
            <Link
              href="/browse"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white transition-colors"
            >
              Explore
            </Link>
            <Link
              href="/map"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white transition-colors"
            >
              <Map className="h-4 w-4" /> Map
            </Link>
            <Link
              href="/how-it-works"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white transition-colors"
            >
              How It Works
            </Link>
            <Link
              href="/contact"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white transition-colors"
            >
              Contact Us
            </Link>
            <Link
              href="/register?role=LANDLORD"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white transition-colors"
            >
              List Your Property
            </Link>

            {user ? (
              <>
                <Link
                  href={user.role === "ADMIN" ? "/admin/dashboard" : user.role === "LANDLORD" ? "/dashboard" : "/tenant"}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white transition-colors"
                >
                  <Home className="h-4 w-4 text-primary shrink-0" />
                  Dashboard
                </Link>
                <button
                  onClick={() => { logout(); setOpen(false); }}
                  className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-red-400 hover:bg-white/10 transition-colors"
                >
                  <LogOut className="h-4 w-4" /> Log out
                </button>
              </>
            ) : (
              <>
                {/* Mobile login options — shown inline, no dropdown */}
                <div className="mt-1 border-t border-white/10 pt-2">
                  <p className="px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-white/30">
                    Log in as
                  </p>
                  <Link
                    href="/login?role=LANDLORD"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white transition-colors"
                  >
                    <Building2 className="h-4 w-4 text-secondary" /> For Landlords
                  </Link>
                  <Link
                    href="/login?role=TENANT"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white transition-colors"
                  >
                    <Home className="h-4 w-4 text-primary" /> For Tenants
                  </Link>
                </div>

                <Link
                  href="/register?role=TENANT"
                  onClick={() => setOpen(false)}
                  className="mt-2 flex items-center justify-center rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Find Your Home
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}