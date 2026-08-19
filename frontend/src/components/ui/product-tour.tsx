"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  ChevronRight, ChevronLeft, X, Sparkles, CheckCircle2,
  Search, Calendar, FileText, DollarSign, Building2, Home,
  AlertCircle, Users, Wrench, Clock, Key, MessageSquare, ShieldCheck,
  CreditCard, MapPin, Heart, Settings, LayoutDashboard, ClipboardList
} from "lucide-react";

export interface TourStep {
  id: string;
  targetSelector?: string;
  title: string;
  content: string;
  badge?: string;
  icon?: any;
  preferredPosition?: "top" | "bottom" | "left" | "right";
}

// ----------------------------------------------------
// SCENARIO 0: Global Landing Page Tour
// ----------------------------------------------------
export const PLATFORM_TOUR_STEPS: TourStep[] = [
  {
    id: "hero-search",
    targetSelector: '[data-tour="hero-search"]',
    title: "Instant Neighborhood Search ",
    content: "Type any location in Nairobi (Kilimani, Westlands, Karen, Kasarani) to instantly filter verified rental properties.",
    badge: "Search Bar",
    icon: Search,
    preferredPosition: "bottom",
  },
  {
    id: "map-preview",
    targetSelector: '[data-tour="map-preview"]',
    title: "Interactive Nairobi Map ",
    content: "View active rental properties pinned spatially across Nairobi to check proximity to transport and amenities.",
    badge: "Interactive Map",
    icon: Home,
    preferredPosition: "top",
  },
  {
    id: "landlord-cta",
    targetSelector: '[data-tour="landlord-cta"]',
    title: "Landlord Property Registration ",
    content: "Property owners can register here to list buildings, create unit categories, and automate M-Pesa rent collection.",
    badge: "Landlord Action",
    icon: Building2,
    preferredPosition: "top",
  },
];

// ----------------------------------------------------
// SCENARIO A: Tenant Dashboard — ALL TABS TOUR
// ----------------------------------------------------
export const TENANT_TOUR_STEPS: TourStep[] = [
  {
    id: "tenant-tab-overview",
    targetSelector: '[data-tour="tenant-tab-overview"]',
    title: "1. Overview Tab ",
    content: "Your home base. View active contracts, pending rent due dates, saved homes, and recent maintenance ticket alerts.",
    badge: "Tab 1 / 11",
    icon: LayoutDashboard,
    preferredPosition: "right",
  },
  {
    id: "tenant-tab-browse",
    targetSelector: '[data-tour="tenant-tab-browse"]',
    title: "2. Explore Tab ",
    content: "Browse and filter verified homes by neighborhood, rent budget, unit type, and verified landlord status.",
    badge: "Tab 2 / 11",
    icon: Search,
    preferredPosition: "right",
  },
  {
    id: "tenant-tab-map",
    targetSelector: '[data-tour="tenant-tab-map"]',
    title: "3. Map View Tab ",
    content: "Explore properties spatially on an interactive Nairobi map to find homes near your office, school, or transport hubs.",
    badge: "Tab 3 / 11",
    icon: MapPin,
    preferredPosition: "right",
  },
  {
    id: "tenant-tab-bookings",
    targetSelector: '[data-tour="tenant-tab-bookings"]',
    title: "4. My Bookings Tab ",
    content: "Track your 7-stage rental progress live: viewing approval → physical inspection → door selection → digital contract signing.",
    badge: "Tab 4 / 11",
    icon: Calendar,
    preferredPosition: "right",
  },
  {
    id: "tenant-tab-contracts",
    targetSelector: '[data-tour="tenant-tab-contracts"]',
    title: "5. My Contracts Tab ",
    content: "Review your active tenancy agreements, monthly rent breakdown, deposit terms, and sign contracts digitally.",
    badge: "Tab 5 / 11",
    icon: FileText,
    preferredPosition: "right",
  },
  {
    id: "tenant-tab-payments",
    targetSelector: '[data-tour="tenant-tab-payments"]',
    title: "6. Rent Payments Tab ",
    content: "Pay your monthly rent securely via M-Pesa STK push prompts sent to your phone and view your rent cycle schedule.",
    badge: "Tab 6 / 11",
    icon: DollarSign,
    preferredPosition: "right",
  },
  {
    id: "tenant-tab-transactions",
    targetSelector: '[data-tour="tenant-tab-transactions"]',
    title: "7. Transactions Tab ",
    content: "Access your complete M-Pesa payment history, download official digital receipts, and track transaction IDs.",
    badge: "Tab 7 / 11",
    icon: CreditCard,
    preferredPosition: "right",
  },
  {
    id: "tenant-tab-issues",
    targetSelector: '[data-tour="tenant-tab-issues"]',
    title: "8. Issues & Maintenance Tab ",
    content: "Submit repair requests with photos (plumbing, electrical, structural) and track your landlord's fix progress.",
    badge: "Tab 8 / 11",
    icon: AlertCircle,
    preferredPosition: "right",
  },
  {
    id: "tenant-tab-saved",
    targetSelector: '[data-tour="tenant-tab-saved"]',
    title: "9. Favorites Tab ",
    content: "Access your shortlisted properties to quickly compare monthly rates, amenities, and locations.",
    badge: "Tab 9 / 11",
    icon: Heart,
    preferredPosition: "right",
  },
  {
    id: "tenant-tab-inbox",
    targetSelector: '[data-tour="tenant-tab-inbox"]',
    title: "10. Messages Tab ",
    content: "Chat directly with your landlord or property agent regarding viewings, tenancy questions, or repair updates.",
    badge: "Tab 10 / 11",
    icon: MessageSquare,
    preferredPosition: "right",
  },
  {
    id: "tenant-tab-settings",
    targetSelector: '[data-tour="tenant-tab-settings"]',
    title: "11. Settings Tab ",
    content: "Manage your personal profile, phone number for M-Pesa payments, notification preferences, and security.",
    badge: "Tab 11 / 11",
    icon: Settings,
    preferredPosition: "right",
  },
];

// ----------------------------------------------------
// SCENARIO B: Landlord Dashboard — ALL TABS TOUR
// ----------------------------------------------------
export const LANDLORD_TOUR_STEPS: TourStep[] = [
  {
    id: "landlord-tab-overview",
    targetSelector: '[data-tour="landlord-tab-overview"]',
    title: "1. Dashboard Overview ",
    content: "Your command center. Track total monthly revenue, building occupancy rates, urgent booking reviews, and open issues.",
    badge: "Tab 1 / 10",
    icon: LayoutDashboard,
    preferredPosition: "right",
  },
  {
    id: "landlord-tab-listings",
    targetSelector: '[data-tour="landlord-tab-listings"]',
    title: "2. My Properties Tab ",
    content: "List multi-door buildings, define unit categories (Studio, 1 Bed, 2 Bed), upload inspection photos, and manage door numbers.",
    badge: "Tab 2 / 10",
    icon: Building2,
    preferredPosition: "right",
  },
  {
    id: "landlord-tab-bookings",
    targetSelector: '[data-tour="landlord-tab-bookings"]',
    title: "3. Manage Bookings Tab ",
    content: "Review incoming tenant viewing requests, approve physical viewings, and prepare & sign digital tenancy agreements.",
    badge: "Tab 3 / 10",
    icon: Calendar,
    preferredPosition: "right",
  },
  {
    id: "landlord-tab-tenants",
    targetSelector: '[data-tour="landlord-tab-tenants"]',
    title: "4. Tenants Management Tab ",
    content: "Directory of active tenants with assigned unit door numbers (e.g. Door A02), contact info, and individual contract links.",
    badge: "Tab 4 / 10",
    icon: Users,
    preferredPosition: "right",
  },
  {
    id: "landlord-tab-waitlist",
    targetSelector: '[data-tour="landlord-tab-waitlist"]',
    title: "5. Waitlist Tab ",
    content: "Turn zero vacancies into leads. Review prospective tenants waiting for fully occupied units and offer vacant rooms instantly.",
    badge: "Tab 5 / 10",
    icon: ClipboardList,
    preferredPosition: "right",
  },
  {
    id: "landlord-tab-issues",
    targetSelector: '[data-tour="landlord-tab-issues"]',
    title: "6. Issues & Maintenance Tab ",
    content: "Track reported property maintenance tickets from tenants, update repair status (In Progress / Resolved), and view photo evidence.",
    badge: "Tab 6 / 10",
    icon: AlertCircle,
    preferredPosition: "right",
  },
  {
    id: "landlord-tab-payments",
    targetSelector: '[data-tour="landlord-tab-payments"]',
    title: "7. Rent Payments Tab ",
    content: "Monitor monthly rent schedules across all properties, identify overdue payments, and trigger M-Pesa STK payment reminders.",
    badge: "Tab 7 / 10",
    icon: DollarSign,
    preferredPosition: "right",
  },
  {
    id: "landlord-tab-transactions",
    targetSelector: '[data-tour="landlord-tab-transactions"]',
    title: "8. All Transactions Tab ",
    content: "Full financial ledger of all rent payments, security deposits, M-Pesa transaction codes, and CSV export functionality.",
    badge: "Tab 8 / 10",
    icon: CreditCard,
    preferredPosition: "right",
  },
  {
    id: "landlord-tab-verification",
    targetSelector: '[data-tour="landlord-tab-verification"]',
    title: "9. Verification Tab ",
    content: "Upload property ownership documents to receive Verified Landlord & Verified Building badges, increasing tenant trust 3x.",
    badge: "Tab 9 / 10",
    icon: ShieldCheck,
    preferredPosition: "right",
  },
  {
    id: "landlord-tab-settings",
    targetSelector: '[data-tour="landlord-tab-settings"]',
    title: "10. Settings Tab ",
    content: "Configure your landlord profile, M-Pesa payout phone number, security credentials, and system notifications.",
    badge: "Tab 10 / 10",
    icon: Settings,
    preferredPosition: "right",
  },
];

// ----------------------------------------------------
// SCENARIO C: Property Detail Discovery Tour
// ----------------------------------------------------
export const DISCOVERY_TOUR_STEPS: TourStep[] = [
  {
    id: "property-title",
    targetSelector: '[data-tour="property-title"]',
    title: "Verified Building Specs ",
    content: "Check building address, total floors, monthly rent range, and verified landlord status.",
    badge: "Property Info",
    icon: Home,
    preferredPosition: "bottom",
  },
  {
    id: "unit-categories",
    targetSelector: '[data-tour="unit-categories"]',
    title: "Unit Categories & Door Vacancies ",
    content: "View available unit types (Studio, 1 Bed, 2 Bed) and see exact vacant door numbers ready for move-in.",
    badge: "Vacant Rooms",
    icon: Key,
    preferredPosition: "top",
  },
  {
    id: "sidebar-cta",
    targetSelector: '[data-tour="sidebar-cta"]',
    title: "Book Unit Spot or Join Waitlist ",
    content: "Click here to book an instant physical viewing or join the waiting list if fully occupied.",
    badge: "Action Button",
    icon: Sparkles,
    preferredPosition: "left",
  },
];

interface ProductTourProps {
  isOpen: boolean;
  onClose: () => void;
  steps?: TourStep[];
}

export function ProductTour({ isOpen, onClose, steps = PLATFORM_TOUR_STEPS }: ProductTourProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [popoverPos, setPopoverPos] = useState<{ top: number; left: number; arrowDir: "top" | "bottom" | "left" | "right" }>({
    top: 100,
    left: 100,
    arrowDir: "left",
  });

  const step = steps[currentStepIndex];

  const updatePosition = useCallback(() => {
    if (!step?.targetSelector) {
      setTargetRect(null);
      return;
    }

    const el = document.querySelector(step.targetSelector);
    if (!el) {
      setTargetRect(null);
      return;
    }

    // Smooth scroll target into view
    el.scrollIntoView({ behavior: "smooth", block: "center" });

    setTimeout(() => {
      const rect = el.getBoundingClientRect();
      setTargetRect(rect);

      const popoverWidth = 360;
      const popoverHeight = 220;
      const margin = 16;

      let top = rect.top + rect.height / 2 - popoverHeight / 2;
      let left = rect.right + margin;
      let arrowDir: "top" | "bottom" | "left" | "right" = "left";

      // If sidebar link on left, default popover to RIGHT of tab link
      if (rect.right + popoverWidth + margin > window.innerWidth - 20) {
        // Fallback to top or bottom
        if (rect.bottom + popoverHeight < window.innerHeight - 20) {
          top = rect.bottom + margin;
          left = Math.max(16, rect.left);
          arrowDir = "top";
        } else {
          top = rect.top - popoverHeight - margin;
          left = Math.max(16, rect.left);
          arrowDir = "bottom";
        }
      }

      // Screen edge constraints
      left = Math.max(16, Math.min(left, window.innerWidth - popoverWidth - 16));
      top = Math.max(16, Math.min(top, window.innerHeight - popoverHeight - 16));

      setPopoverPos({ top, left, arrowDir });
    }, 250);
  }, [step]);

  useEffect(() => {
    if (isOpen) {
      updatePosition();
      const handleResize = () => updatePosition();
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, [isOpen, currentStepIndex, updatePosition]);

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      onClose();
      setCurrentStepIndex(0);
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, currentStepIndex]);

  if (!isOpen || !step) return null;

  const StepIcon = step.icon || Sparkles;
  const progressPercent = Math.round(((currentStepIndex + 1) / steps.length) * 100);

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Dark Overlay */}
      <div
        onClick={onClose}
        className="pointer-events-auto fixed inset-0 bg-foreground/60 backdrop-blur-[2px] transition-opacity duration-300"
      />

      {/* Target Element Spotlight Ping & Highlight */}
      {targetRect && (
        <>
          <div
            className="fixed pointer-events-none rounded-xl border-2 border-primary animate-ping opacity-75 z-50"
            style={{
              top: `${targetRect.top - 4}px`,
              left: `${targetRect.left - 4}px`,
              width: `${targetRect.width + 8}px`,
              height: `${targetRect.height + 8}px`,
            }}
          />

          <div
            className="fixed pointer-events-none rounded-xl ring-4 ring-primary ring-offset-2 bg-primary/10 transition-all duration-300 z-50 shadow-[0_0_0_9999px_rgba(0,0,0,0.65)]"
            style={{
              top: `${targetRect.top - 4}px`,
              left: `${targetRect.left - 4}px`,
              width: `${targetRect.width + 8}px`,
              height: `${targetRect.height + 8}px`,
            }}
          />
        </>
      )}

      {/* Floating Animated Tooltip Beside Sidebar Tab */}
      <div
        className="pointer-events-auto fixed z-50 w-full max-w-[360px] rounded-3xl border border-border bg-card p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-300"
        style={{
          top: `${popoverPos.top}px`,
          left: `${popoverPos.left}px`,
        }}
      >
        {/* Pointer Arrow */}
        {popoverPos.arrowDir === "left" && (
          <div className="absolute -left-2 top-8 h-4 w-4 rotate-45 border-b border-l border-border bg-card" />
        )}
        {popoverPos.arrowDir === "top" && (
          <div className="absolute -top-2 left-8 h-4 w-4 rotate-45 border-t border-l border-border bg-card" />
        )}
        {popoverPos.arrowDir === "bottom" && (
          <div className="absolute -bottom-2 left-8 h-4 w-4 rotate-45 border-b border-r border-border bg-card" />
        )}
        {popoverPos.arrowDir === "right" && (
          <div className="absolute -right-2 top-8 h-4 w-4 rotate-45 border-t border-r border-border bg-card" />
        )}

        {/* Header: Badge + Counter + Close */}
        <div className="flex items-center justify-between border-b border-border pb-2.5">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-[11px] font-bold text-primary flex items-center gap-1.5">
              <StepIcon className="h-3.5 w-3.5" />
              {step.badge || `Tab ${currentStepIndex + 1}`}
            </span>
            <span className="text-[11px] font-semibold text-muted-foreground">
              {currentStepIndex + 1} of {steps.length}
            </span>
          </div>

          <button
            onClick={onClose}
            className="flex h-6 w-6 items-center justify-center rounded-full border border-border hover:bg-muted text-muted-foreground transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="space-y-1.5">
          <h3 className="text-base font-extrabold text-foreground flex items-center gap-2">
            {step.title}
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {step.content}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Actions Footer */}
        <div className="pt-1 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            Skip
          </button>

          <div className="flex items-center gap-2">
            {currentStepIndex > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrev}
                className="h-8 text-xs font-semibold gap-1 px-3"
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Back
              </Button>
            )}

            <Button
              size="sm"
              onClick={handleNext}
              className="h-8 bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-xs px-4 gap-1"
            >
              {currentStepIndex === steps.length - 1 ? (
                <>Finish Tour </>
              ) : (
                <>
                  Next <ChevronRight className="h-3.5 w-3.5" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

{/* Floating Trigger Button Component */}
export function ProductTourTrigger({ onClick, label = "Dashboard Tabs Tour 🚀" }: { onClick: () => void; label?: string }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full border border-primary/30 bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground shadow-xl hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all"
    >
      <Sparkles className="h-4 w-4 text-secondary animate-spin" style={{ animationDuration: "4s" }} />
      <span>{label}</span>
    </button>
  );
}
