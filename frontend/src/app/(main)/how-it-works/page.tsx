"use client";

import { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/app/features/landing-page/components/navbar";
import { Footer } from "@/app/features/landing-page/components/footer";
import { Button } from "@/components/ui/button";
import {
  Search, Calendar, CheckCircle2, Home, FileText, DollarSign, Key,
  Building2, ShieldCheck, ArrowRight, Clock, HelpCircle, ChevronDown,
  Sparkles, Phone, MessageSquare, AlertCircle, Wrench
} from "lucide-react";

const TENANT_STAGES = [
  {
    num: 1,
    title: "1. Search & Filter Verified Homes",
    subtitle: "Explore authentic property listings in top Nairobi neighborhoods with verified photos, amenities, and inspection reports.",
    icon: Search,
    color: "from-blue-500/20 to-indigo-500/10 border-blue-500/30 text-blue-500",
    badge: "Step 1",
  },
  {
    num: 2,
    title: "2. Book Unit Category & Request Viewing",
    subtitle: "Select your desired unit type (e.g. 1 Bedroom) and submit a viewing request directly to the landlord.",
    icon: Calendar,
    color: "from-amber-500/20 to-orange-500/10 border-amber-500/30 text-amber-500",
    badge: "Step 2",
  },
  {
    num: 3,
    title: "3. Physical Property Inspection",
    subtitle: "Visit the building in person to view available rooms and confirm property condition with the landlord or agent.",
    icon: Building2,
    color: "from-emerald-500/20 to-teal-500/10 border-emerald-500/30 text-emerald-500",
    badge: "Step 3",
  },
  {
    num: 4,
    title: "4. Select Specific Door Number",
    subtitle: "After inspection, pick the exact door number (e.g., Door A02) you inspected and want to rent.",
    icon: Key,
    color: "from-purple-500/20 to-pink-500/10 border-purple-500/30 text-purple-500",
    badge: "Step 4",
  },
  {
    num: 5,
    title: "5. Digital Tenancy Agreement",
    subtitle: "Review the landlord's prepared tenancy contract online and digitally sign to confirm your lease terms.",
    icon: FileText,
    color: "from-blue-600/20 to-cyan-500/10 border-blue-600/30 text-blue-600",
    badge: "Step 5",
  },
  {
    num: 6,
    title: "6. M-Pesa STK Push Payment",
    subtitle: "Receive an instant M-Pesa prompt on your phone for 1st month's rent + deposit. Pay securely with your PIN.",
    icon: DollarSign,
    color: "from-emerald-600/20 to-green-500/10 border-emerald-600/30 text-emerald-600",
    badge: "Step 6",
  },
  {
    num: 7,
    title: "7. Move-In & Digital Tenancy Portal",
    subtitle: "Collect your keys! Use your tenant portal to track rent payment history, download receipts, and report maintenance issues.",
    icon: CheckCircle2,
    color: "from-primary/20 to-emerald-500/10 border-primary/30 text-primary",
    badge: "Step 7",
  },
];

const LANDLORD_STEPS = [
  {
    num: 1,
    title: "List Buildings & Unit Types",
    subtitle: "Create property profiles, define unit categories (Studio, 1 Bed, 2 Bed), and add door numbers with floor plans.",
    icon: Home,
  },
  {
    num: 2,
    title: "Get Verified Landlord Badge",
    subtitle: "Submit ownership details to receive a Verified Building badge, increasing tenant trust and booking rates by up to 3x.",
    icon: ShieldCheck,
  },
  {
    num: 3,
    title: "Automated Waitlist System",
    subtitle: "Never lose a lead when fully occupied. Prospective tenants join your waiting list and get notified the moment a unit opens.",
    icon: Clock,
  },
  {
    num: 4,
    title: "M-Pesa Rent Collection & Ledgers",
    subtitle: "Send M-Pesa STK payment prompts to tenants, auto-reconcile payments, track overdue rent, and export financial reports.",
    icon: DollarSign,
  },
];

const FAQS = [
  {
    q: "How does M-Pesa payment work on Nyumba.ke?",
    a: "When rent or deposit is due, a direct M-Pesa STK Push prompt is sent to your phone number. You simply enter your M-Pesa PIN, and the transaction is instantly processed and recorded on your digital tenancy ledger with an official receipt.",
  },
  {
    q: "Do I need to visit the property in person before paying?",
    a: "Yes! Nyumba.ke strictly requires a physical viewing stage (Stage 3) before contract signing or payment. You inspect the exact door number in person first to ensure complete peace of mind.",
  },
  {
    q: "What if a property or unit category is fully occupied?",
    a: "If a unit category has no current vacancies, you can click 'Join Waiting List' to set your target move-in date and max budget. The landlord will receive your preferences and notify you first when a unit frees up.",
  },
  {
    q: "How are maintenance and repairs handled during tenancy?",
    a: "Tenants can log in to their dashboard and submit an issue ticket under 'Issues & Maintenance' with photos. The landlord receives immediate notification to assign repair personnel and track resolution status.",
  },
  {
    q: "What is a Verified Building / Verified Landlord badge?",
    a: "Verified badges signify that Nyumba.ke field agents have inspected the building and verified the landlord's credentials, protecting tenants against listing fraud and ghost properties.",
  },
];

export default function HowItWorksPage() {
  const [activeRole, setActiveRole] = useState<"tenant" | "landlord">("tenant");
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden bg-gradient-to-b from-foreground via-foreground/95 to-background text-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent opacity-60" />
        
        <div className="relative mx-auto max-w-5xl text-center space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold text-white backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-secondary" />
            Kenya&apos;s 1st End-to-End Digital Tenancy Platform
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl text-white">
            How <span className="text-secondary">Nyumba.ke</span> Works
          </h1>

          <p className="mx-auto max-w-2xl text-base sm:text-lg text-white/80 leading-relaxed font-normal">
            Say goodbye to fake agents, manual paperwork, and payment disputes. Nyumba.ke digitizes the entire Kenyan rental lifecycle from discovery to M-Pesa STK receipts.
          </p>

          {/* Role Switcher Pills */}
          <div className="pt-4 flex justify-center">
            <div className="inline-flex rounded-2xl bg-white/10 p-1.5 backdrop-blur-md border border-white/20">
              <button
                onClick={() => setActiveRole("tenant")}
                className={`flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold transition-all ${
                  activeRole === "tenant"
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-white/70 hover:text-white"
                }`}
              >
                <Home className="h-4 w-4" /> For Tenants
              </button>
              <button
                onClick={() => setActiveRole("landlord")}
                className={`flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold transition-all ${
                  activeRole === "landlord"
                    ? "bg-secondary text-secondary-foreground shadow-md"
                    : "text-white/70 hover:text-white"
                }`}
              >
                <Building2 className="h-4 w-4" /> For Landlords
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Body */}
      <main className="flex-1 py-16 px-6">
        <div className="mx-auto max-w-6xl space-y-20">

          {/* Tenant 7-Stage Process */}
          {activeRole === "tenant" ? (
            <div className="space-y-12 animate-in fade-in duration-300">
              <div className="text-center max-w-2xl mx-auto space-y-2">
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">The 7-Stage Digital Rental Journey</h2>
                <p className="text-sm text-muted-foreground">Every step is tracked transparently on your personal tenant dashboard.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {TENANT_STAGES.map((s) => {
                  const Icon = s.icon;
                  return (
                    <div key={s.num} className="rounded-2xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br border ${s.color}`}>
                            <Icon className="h-6 w-6" />
                          </div>
                          <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest bg-muted px-2.5 py-1 rounded-md">
                            {s.badge}
                          </span>
                        </div>
                        <h3 className="font-bold text-lg text-foreground">{s.title}</h3>
                        <p className="text-xs text-muted-foreground leading-relaxed">{s.subtitle}</p>
                      </div>
                    </div>
                  );
                })}

                {/* Card 8: Quick Action CTA Card */}
                <div className="rounded-2xl bg-gradient-to-br from-primary to-primary/80 p-6 text-primary-foreground flex flex-col justify-between space-y-4 shadow-md">
                  <div className="space-y-2">
                    <Sparkles className="h-8 w-8 text-primary-foreground" />
                    <h3 className="font-extrabold text-xl">Ready to find your next home?</h3>
                    <p className="text-xs opacity-90 leading-relaxed">
                      Explore verified listings across Westlands, Kilimani, Karen, Lavington, Kasarani, and more.
                    </p>
                  </div>
                  <Link href="/browse">
                    <Button className="w-full bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-bold gap-2">
                      Explore Listings <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            /* Landlord 4-Step Process */
            <div className="space-y-12 animate-in fade-in duration-300">
              <div className="text-center max-w-2xl mx-auto space-y-2">
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Streamlined Property Management for Landlords</h2>
                <p className="text-sm text-muted-foreground">Automate bookings, tenancy contracts, and M-Pesa rent collections.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {LANDLORD_STEPS.map((step) => {
                  const Icon = step.icon;
                  return (
                    <div key={step.num} className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/15 text-secondary border border-secondary/30">
                        <Icon className="h-6 w-6" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-secondary">Step 0{step.num}</span>
                        <h3 className="font-bold text-base mt-1 text-foreground">{step.title}</h3>
                        <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{step.subtitle}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="rounded-3xl bg-gradient-to-r from-foreground via-foreground/95 to-slate-900 p-8 sm:p-12 text-white flex flex-col sm:flex-row items-center justify-between gap-8 shadow-xl border border-white/10">
                <div className="space-y-3 text-center sm:text-left max-w-xl">
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-secondary uppercase tracking-widest">
                    <ShieldCheck className="h-4 w-4" /> Join 100+ Landlords in Nairobi
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-extrabold">Start Listing Your Properties Today</h3>
                  <p className="text-xs sm:text-sm text-white/70 leading-relaxed">
                    Zero upfront fees for listing. Gain access to verified Kenyan renters and digital M-Pesa rent collection.
                  </p>
                </div>
                <Link href="/register?role=LANDLORD" className="shrink-0">
                  <Button size="lg" className="bg-secondary text-secondary-foreground hover:bg-secondary/90 font-bold px-8 h-12 gap-2 text-base">
                    List Your Property <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {/* Interactive FAQ Accordion */}
          <div className="space-y-8 pt-8 border-t border-border">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-primary uppercase tracking-widest">
                <HelpCircle className="h-4 w-4" /> Frequently Asked Questions
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold">Got Questions? We Have Answers</h2>
            </div>

            <div className="mx-auto max-w-3xl space-y-3">
              {FAQS.map((faq, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div key={idx} className="rounded-xl border border-border bg-card overflow-hidden transition-colors">
                    <button
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      className="w-full flex items-center justify-between p-5 text-left font-semibold text-sm sm:text-base text-foreground"
                    >
                      <span>{faq.q}</span>
                      <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 shrink-0 ml-4 ${
                        isOpen ? "rotate-180 text-primary" : ""
                      }`} />
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-5 text-xs sm:text-sm text-muted-foreground leading-relaxed border-t border-border/50 pt-3 animate-in fade-in duration-200">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Need Direct Help Banner */}
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <div className="space-y-1">
              <p className="font-bold text-foreground text-sm sm:text-base">Have specific questions about your booking or listing?</p>
              <p className="text-xs text-muted-foreground">Our Nairobi customer support team is available Mon–Sat (8am – 6pm EAT).</p>
            </div>
            <Link href="/contact" className="shrink-0">
              <Button variant="outline" className="gap-2 border-primary/30 text-primary hover:bg-primary/10 font-bold">
                <MessageSquare className="h-4 w-4" /> Contact Support →
              </Button>
            </Link>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
