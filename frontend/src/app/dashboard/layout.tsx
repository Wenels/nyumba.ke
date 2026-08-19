"use client";

import {
  AlertCircle,
  Bell,
  CalendarCheck,
  CreditCard,
  DollarSign,
  Home,
  LayoutDashboard,
  ListChecks,
  ClipboardList,
  LogOut,
  Menu,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  ShieldCheck,
  Sun,
  User,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/app/features/auth/hooks/use-auth";

const NAV_ITEMS = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Overview" },
  { href: "/dashboard/listings", icon: ListChecks, label: "My Properties" },
  {
    href: "/dashboard/bookings",
    icon: CalendarCheck,
    label: "Manage Bookings",
  },
  { href: "/dashboard/tenants", icon: Users, label: "Tenants" },
  { href: "/dashboard/waitlist", icon: ClipboardList, label: "Waitlist" },
  { href: "/dashboard/issues", icon: AlertCircle, label: "Issues" },
  { href: "/dashboard/payments", icon: DollarSign, label: "Rent Payments" },
  {
    href: "/dashboard/transactions",
    icon: CreditCard,
    label: "All Transactions",
  },
  { href: "/dashboard/verification", icon: ShieldCheck, label: "Verification" },
  { href: "/dashboard/settings", icon: Settings, label: "Settings" },
];

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);

  // Mobile drawer nav links (always expanded)
  const MobileNavLinks = () => (
    <>
      {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
        const active =
          href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={() => setMobileOpen(false)}
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
    </>
  );
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const [notificationTab, setNotificationTab] = useState<"all" | "unread">(
    "all",
  );

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        profileRef.current &&
        !profileRef.current.contains(e.target as Node)
      ) {
        setProfileOpen(false);
      }
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(e.target as Node)
      ) {
        setNotificationsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [isDark]);

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
      <aside
        className={`hidden shrink-0 border-r border-border bg-background lg:flex lg:flex-col transition-all duration-300 ease-in-out ${
          collapsed ? "w-[68px]" : "w-64"
        }`}
      >
        {/* Logo + collapse toggle */}
        <div
          className={`border-b border-border py-4 flex items-center transition-all duration-300 ${
            collapsed ? "px-3 justify-center" : "px-6 justify-between"
          }`}
        >
          {!collapsed && (
            <Link href="/" className="flex items-center gap-2.5 min-w-0">
              <Image
                src="/logo.svg"
                alt="Nyumba.ke"
                width={32}
                height={32}
                className="rounded-lg shrink-0 object-contain"
              />
              <span className="font-bold min-w-0 truncate text-base">
                nyumba<span className="text-secondary">.ke</span>
              </span>
            </Link>
          )}
          {collapsed && (
            <Link href="/" title="Nyumba.ke">
              <Image
                src="/logo.svg"
                alt="Nyumba.ke"
                width={32}
                height={32}
                className="rounded-lg shrink-0 object-contain"
              />
            </Link>
          )}
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors ${
              collapsed ? "mt-2" : ""
            }`}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* User info */}
        {!collapsed && (
          <div className="border-b border-border px-6 py-4">
            <p className="text-sm font-semibold truncate">{user?.fullName}</p>
            <p className="text-xs text-muted-foreground truncate">
              {user?.email}
            </p>
            <span className="mt-1.5 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary capitalize font-medium">
              {user?.role.toLowerCase()}
            </span>
          </div>
        )}

        {/* Collapsed avatar */}
        {collapsed && (
          <div className="border-b border-border py-3 flex justify-center">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold"
              title={user?.fullName}
            >
              {getInitials(user?.fullName || "U")}
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className={`flex-1 space-y-1 py-4 ${collapsed ? "px-2" : "px-3"}`}>
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
            const active =
              href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                data-tour={`landlord-tab-${href.split("/").pop() || "overview"}`}
                title={collapsed ? label : undefined}
                className={`flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  collapsed ? "justify-center gap-0" : "gap-3"
                } ${
                  active
                    ? "bg-secondary/10 text-secondary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed && (
                  <span className="truncate transition-opacity duration-150">
                    {label}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div
          className={`border-t border-border py-4 ${collapsed ? "px-2" : "px-3"}`}
        >
          <button
            type="button"
            onClick={() => logout()}
            title={collapsed ? "Log out" : undefined}
            className={`flex w-full items-center rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-destructive transition-colors ${
              collapsed ? "justify-center gap-0" : "gap-3"
            }`}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Log out</span>}
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        // biome-ignore lint/a11y/noStaticElementInteractions: overlay backdrop
        // biome-ignore lint/a11y/useKeyWithClickEvents: overlay backdrop
        <div
          className="fixed inset-0 z-40 bg-foreground/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-y-0 left-0 z-50 w-64 bg-background border-r border-border flex flex-col lg:hidden">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <Link href="/" className="flex items-center gap-2.5">
              <Image
                src="/logo.svg"
                alt="Nyumba.ke"
                width={28}
                height={28}
                className="rounded-lg shrink-0 object-contain"
              />
              <span className="text-sm font-bold">
                nyumba<span className="text-secondary">.ke</span>
              </span>
            </Link>
            <button type="button" onClick={() => setMobileOpen(false)}>
              <X className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto space-y-0.5 px-3 py-4">
            <MobileNavLinks />
          </nav>
          <div className="border-t border-border px-3 py-4">
            <button
              type="button"
              onClick={() => {
                logout();
                setMobileOpen(false);
              }}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-destructive transition-colors"
            >
              <LogOut className="h-4 w-4" /> Log out
            </button>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col">
        {/* ——— Desktop Top Navbar ——— */}
        <header className="hidden lg:flex items-center justify-between border-b border-border bg-background px-6 py-3">
          {/* Left: Brand + Subtitle */}
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-secondary to-primary shadow-sm">
              <Home className="h-4 w-4 text-white" />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-bold text-foreground tracking-tight">
                nyumba<span className="text-secondary">.ke</span>
              </p>
              <p className="text-[11px] text-muted-foreground font-medium">
                Landlord Portal
              </p>
            </div>
          </div>

          {/* Right: Theme toggle + Bell + User */}
          <div className="flex items-center gap-2">
            {/* Theme toggle */}
            <button
              type="button"
              onClick={() => setIsDark(!isDark)}
              className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              aria-label="Toggle dark mode"
            >
              {isDark ? (
                <Sun className="h-[18px] w-[18px]" />
              ) : (
                <Moon className="h-[18px] w-[18px]" />
              )}
            </button>

            {/* Notifications */}
            <div className="relative" ref={notificationsRef}>
              <button
                type="button"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                aria-label="Notifications"
              >
                <Bell className="h-[18px] w-[18px]" />
                {/* Dot indicator for unread */}
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-background" />
              </button>

              {/* Notifications Dropdown */}
              {notificationsOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-border bg-background shadow-lg py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="flex items-center justify-between px-4 pb-2 border-b border-border">
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4 text-primary" />
                      <span className="font-semibold text-sm">
                        Notifications
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setNotificationsOpen(false)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="px-4 py-2 flex gap-2 border-b border-border">
                    <button
                      type="button"
                      onClick={() => setNotificationTab("all")}
                      className={`flex-1 text-xs font-semibold py-1.5 rounded-md transition-colors ${
                        notificationTab === "all"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      All
                    </button>
                    <button
                      type="button"
                      onClick={() => setNotificationTab("unread")}
                      className={`flex-1 text-xs font-semibold py-1.5 rounded-md transition-colors ${
                        notificationTab === "unread"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      Unread
                    </button>
                  </div>
                  <div className="flex flex-col items-center justify-center py-10 px-4 text-center space-y-3">
                    <div className="rounded-full bg-muted/50 p-4">
                      <Bell className="h-8 w-8 text-muted-foreground/50" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        No notifications
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Notifications will appear here
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="mx-1 h-8 w-px bg-border" />

            {/* User info + Avatar (clickable dropdown) */}
            <div className="relative" ref={profileRef}>
              <button
                type="button"
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-3 rounded-lg px-2 py-1.5 -mr-2 hover:bg-muted/60 transition-colors"
              >
                <div className="text-right leading-tight">
                  <p className="text-sm font-semibold text-foreground truncate max-w-[160px]">
                    {user?.fullName}
                  </p>
                  <p className="text-[11px] text-muted-foreground font-medium capitalize">
                    {user?.role.toLowerCase()}
                  </p>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-xs font-bold shadow-sm">
                  {getInitials(user?.fullName || "U")}
                </div>
              </button>

              {/* Dropdown */}
              {profileOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-border bg-background shadow-lg py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <Link
                    href="/dashboard/profile"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                  >
                    <User className="h-4 w-4 text-muted-foreground" />
                    Profile
                  </Link>
                  <Link
                    href="/dashboard/settings"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                  >
                    <Settings className="h-4 w-4 text-muted-foreground" />
                    Settings
                  </Link>
                  <div className="my-1 h-px bg-border" />
                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false);
                      logout();
                    }}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Mobile header */}
        <header className="flex items-center justify-between border-b border-border bg-background px-6 py-4 lg:hidden">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors mr-1"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <Link href="/" className="flex items-center gap-2 font-bold">
              <Image
                src="/logo.svg"
                alt="Nyumba.ke"
                width={26}
                height={26}
                className="rounded-lg shrink-0 object-contain"
              />
              <span>nyumba<span className="text-secondary">.ke</span></span>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsDark(!isDark)}
              className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted transition-colors"
              aria-label="Toggle dark mode"
            >
              {isDark ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted transition-colors"
                aria-label="Notifications"
              >
                <Bell className="h-4 w-4" />
                <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-red-500 ring-2 ring-background" />
              </button>

              {/* Mobile Notifications Dropdown */}
              {notificationsOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 rounded-xl border border-border bg-background shadow-lg py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="flex items-center justify-between px-4 pb-2 border-b border-border">
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4 text-primary" />
                      <span className="font-semibold text-sm">
                        Notifications
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setNotificationsOpen(false)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="px-4 py-2 flex gap-2 border-b border-border">
                    <button
                      type="button"
                      onClick={() => setNotificationTab("all")}
                      className={`flex-1 text-xs font-semibold py-1.5 rounded-md transition-colors ${
                        notificationTab === "all"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      All
                    </button>
                    <button
                      type="button"
                      onClick={() => setNotificationTab("unread")}
                      className={`flex-1 text-xs font-semibold py-1.5 rounded-md transition-colors ${
                        notificationTab === "unread"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      Unread
                    </button>
                  </div>
                  <div className="flex flex-col items-center justify-center py-10 px-4 text-center space-y-3">
                    <div className="rounded-full bg-muted/50 p-4">
                      <Bell className="h-8 w-8 text-muted-foreground/50" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        No notifications
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Notifications will appear here
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <Link
              href="/"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              ← Home
            </Link>
          </div>
        </header>

        <main className="flex-1 px-6 py-8 max-w-5xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
