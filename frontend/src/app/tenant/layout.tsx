"use client";

import {
  AlertCircle,
  Bell,
  CalendarCheck,
  CreditCard,
  DollarSign,
  FileText,
  Heart,
  Home,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  MessageSquare,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Settings,
  Sun,
  User,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/app/features/auth/hooks/use-auth";

const NAV_ITEMS = [
  { href: "/tenant", icon: LayoutDashboard, label: "Overview" },
  { href: "/tenant/browse", icon: Search, label: "Explore" },
  { href: "/tenant/map", icon: MapPin, label: "Map View" },
  { href: "/tenant/bookings", icon: CalendarCheck, label: "My Bookings" },
  { href: "/tenant/contracts", icon: FileText, label: "My Contracts" },
  { href: "/tenant/payments", icon: DollarSign, label: "Rent Payments" },
  { href: "/tenant/transactions", icon: CreditCard, label: "Transactions" },
  { href: "/tenant/issues", icon: AlertCircle, label: "Issues" },
  { href: "/tenant/saved", icon: Heart, label: "Favorites" },
  { href: "/tenant/inbox", icon: MessageSquare, label: "Messages" },
  { href: "/tenant/settings", icon: Settings, label: "Settings" },
];

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function TenantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const [notificationTab, setNotificationTab] = useState<"all" | "unread">(
    "all",
  );

  useEffect(() => {
    if (!isLoading && !user) router.push("/login");
  }, [isLoading, user, router]);

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

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) return null;

  // Nav links — icon-only when collapsed
  const NavLinks = ({ onClick }: { onClick?: () => void }) => (
    <>
      {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
        const active =
          href === "/tenant"
            ? pathname === "/tenant"
            : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onClick}
            title={collapsed ? label : undefined}
            className={`flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
              collapsed ? "justify-center gap-0" : "gap-3"
            } ${
              active
                ? "bg-primary text-primary-foreground"
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
    </>
  );

  // Mobile drawer nav links (always expanded)
  const MobileNavLinks = () => (
    <>
      {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
        const active =
          href === "/tenant"
            ? pathname === "/tenant"
            : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              active
                ? "bg-primary text-primary-foreground"
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

  return (
    <div className="flex min-h-screen bg-muted/20">
      {/* ——— Desktop Sidebar ——— */}
      <aside
        className={`hidden shrink-0 border-r border-border bg-background lg:flex lg:flex-col transition-all duration-300 ease-in-out ${
          collapsed ? "w-[68px]" : "w-60"
        }`}
      >
        {/* Logo + collapse toggle */}
        <div
          className={`border-b border-border py-4 flex items-center transition-all duration-300 ${
            collapsed ? "px-3 justify-center" : "px-5 justify-between"
          }`}
        >
          {!collapsed && (
            <Link href="/" className="flex items-center gap-2 min-w-0">
              <Image
                src="/logo.png"
                alt="Nyumba.ke"
                width={28}
                height={28}
                className="rounded-lg shrink-0"
              />
              <div className="min-w-0">
                <span className="text-sm font-bold block truncate">
                  nyumba<span className="text-secondary">.ke</span>
                </span>
                <p className="text-xs text-muted-foreground truncate">
                  Tenant Portal
                </p>
              </div>
            </Link>
          )}
          {collapsed && (
            <Link href="/" title="Nyumba.ke">
              <Image
                src="/logo.png"
                alt="Nyumba.ke"
                width={28}
                height={28}
                className="rounded-lg"
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
          <div className="border-b border-border px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                {getInitials(user.fullName)}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">
                  {user.fullName}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user.email}
                </p>
              </div>
            </div>
            <span className="mt-2 inline-block rounded-full bg-secondary/10 px-2.5 py-0.5 text-xs font-medium text-secondary capitalize">
              {user.role.toLowerCase()}
            </span>
          </div>
        )}

        {/* Collapsed avatar */}
        {collapsed && (
          <div className="border-b border-border py-3 flex justify-center">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold"
              title={user.fullName}
            >
              {getInitials(user.fullName)}
            </div>
          </div>
        )}

        {/* Nav */}
        <nav
          className={`flex-1 overflow-y-auto space-y-0.5 py-4 ${
            collapsed ? "px-2" : "px-3"
          }`}
        >
          <NavLinks />
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
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/logo.png"
                alt="Nyumba.ke"
                width={24}
                height={24}
                className="rounded-lg"
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

      {/* ——— Main content ——— */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Desktop Top Navbar */}
        <header className="hidden lg:flex items-center justify-between border-b border-border bg-background px-6 py-3">
          {/* Left: Brand */}
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-secondary to-primary shadow-sm">
              <Home className="h-4 w-4 text-white" />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-bold text-foreground tracking-tight">
                nyumba<span className="text-secondary">.ke</span>
              </p>
              <p className="text-[11px] text-muted-foreground font-medium">
                Tenant Portal
              </p>
            </div>
          </div>

          {/* Right: Theme + Bell + User */}
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
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-background" />
              </button>

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

            {/* User avatar + dropdown */}
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

              {profileOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-border bg-background shadow-lg py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <Link
                    href="/tenant/profile"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                  >
                    <User className="h-4 w-4 text-muted-foreground" />
                    Profile Info
                  </Link>
                  <Link
                    href="/tenant/settings"
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
              nyumba<span className="text-secondary">.ke</span>
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

        {/* Page content */}
        <main className="flex-1 overflow-auto px-6 py-6 max-w-6xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
