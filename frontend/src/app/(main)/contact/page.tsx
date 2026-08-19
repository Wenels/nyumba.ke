"use client";

import { useState } from "react";
import { Navbar } from "@/app/features/landing-page/components/navbar";
import { Footer } from "@/app/features/landing-page/components/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Phone, Mail, MapPin, Clock, Send, CheckCircle2, MessageSquare,
  ShieldCheck, HelpCircle, Building2, User, Sparkles
} from "lucide-react";
import { toast } from "sonner";

export default function ContactPage() {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    role: "TENANT",
    subject: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.fullName || !form.email || !form.message) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      toast.success("Message sent successfully!", {
        description: "Our Nairobi support team will respond to your email within 2 hours.",
      });
    }, 1000);
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />

      {/* Hero Header */}
      <section className="relative pt-32 pb-16 px-6 overflow-hidden bg-gradient-to-b from-foreground via-foreground/95 to-background text-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent opacity-60" />

        <div className="relative mx-auto max-w-4xl text-center space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold text-white backdrop-blur-md">
            <MessageSquare className="h-3.5 w-3.5 text-secondary" />
            We&apos;re Here to Assist You
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl text-white">
            Get in Touch with <span className="text-secondary">Nyumba.ke</span>
          </h1>

          <p className="mx-auto max-w-2xl text-sm sm:text-base text-white/80 leading-relaxed">
            Have questions about a property listing, M-Pesa rent payments, or landlord verification? Send us a message or contact our Nairobi support team.
          </p>
        </div>
      </section>

      {/* Contact Content Body */}
      <main className="flex-1 py-12 px-6">
        <div className="mx-auto max-w-6xl space-y-12">

          {/* 3 Contact Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Phone */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm flex flex-col justify-between space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-primary border border-primary/20">
                <Phone className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-base text-foreground">Call or WhatsApp</h3>
                <p className="text-xs text-muted-foreground">Mon–Sat, 8:00 AM – 6:00 PM EAT</p>
                <p className="text-sm font-bold text-primary pt-2">+254 700 000 000</p>
                <p className="text-xs font-semibold text-muted-foreground">+254 711 000 000</p>
              </div>
            </div>

            {/* Email */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm flex flex-col justify-between space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/15 text-secondary border border-secondary/20">
                <Mail className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-base text-foreground">Email Support</h3>
                <p className="text-xs text-muted-foreground">Average response time: 2 hours</p>
                <p className="text-sm font-bold text-secondary pt-2">support@nyumba.ke</p>
                <p className="text-xs font-semibold text-muted-foreground">info@nyumba.ke</p>
              </div>
            </div>

            {/* Office Location */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm flex flex-col justify-between space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 border border-emerald-500/20">
                <MapPin className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-base text-foreground">Nairobi Office</h3>
                <p className="text-xs text-muted-foreground">Headquarters</p>
                <p className="text-xs font-semibold text-foreground pt-1 leading-relaxed">
                  Westlands Commercial Center, Ring Road Parklands, Nairobi, Kenya
                </p>
              </div>
            </div>
          </div>

          {/* Form & Map Split Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-8 items-start">
            
            {/* Contact Form */}
            <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-sm space-y-6">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-foreground">Send Us a Message</h2>
                <p className="text-xs text-muted-foreground mt-1">Fill out the form below and our team will get back to you promptly.</p>
              </div>

              {submitted ? (
                <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-8 text-center space-y-4 animate-in fade-in duration-300">
                  <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-600" />
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold text-emerald-900">Thank You, {form.fullName}!</h3>
                    <p className="text-xs text-emerald-700 max-w-sm mx-auto">
                      Your message has been received. Our team will review your inquiry and email you back at <strong>{form.email}</strong> shortly.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => { setSubmitted(false); setForm({ fullName: "", email: "", phone: "", role: "TENANT", subject: "", message: "" }); }}
                    className="border-emerald-300 text-emerald-800 hover:bg-emerald-100 font-semibold text-xs"
                  >
                    Send Another Message
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4 text-sm">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Full Name *</Label>
                      <Input
                        required
                        value={form.fullName}
                        onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                        placeholder="John Doe"
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Email Address *</Label>
                      <Input
                        required
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="john@example.com"
                        className="mt-1.5"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Phone Number</Label>
                      <Input
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        placeholder="07XX XXX XXX"
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">I am a *</Label>
                      <select
                        value={form.role}
                        onChange={(e) => setForm({ ...form, role: e.target.value })}
                        className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-medium"
                      >
                        <option value="TENANT">Tenant / Renter</option>
                        <option value="LANDLORD">Landlord / Property Owner</option>
                        <option value="AGENT">Property Manager / Agent</option>
                        <option value="PARTNER">Business Partner / Press</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Subject *</Label>
                    <Input
                      required
                      value={form.subject}
                      onChange={(e) => setForm({ ...form, subject: e.target.value })}
                      placeholder="E.g., Query about M-Pesa payment, listing verification, etc."
                      className="mt-1.5"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Message *</Label>
                    <textarea
                      required
                      rows={4}
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      placeholder="Describe your inquiry in detail..."
                      className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>

                  <Button
                    type="submit"
                    loading={isSubmitting}
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold h-11 text-base gap-2"
                  >
                    <Send className="h-4 w-4" /> Send Message
                  </Button>
                </form>
              )}
            </div>

            {/* Side Card: Coverage & Quick Assistance */}
            <div className="space-y-6">
              {/* Coverage Card */}
              <div className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  <h3 className="font-bold text-base text-foreground">Coverage Areas in Nairobi</h3>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  We currently operate across major residential hubs in Nairobi, Kenya:
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {["Westlands", "Kilimani", "Lavington", "Karen", "Kasarani", "Roysambu", "South B", "South C", "Kileleshwa"].map((area) => (
                    <span key={area} className="rounded-full border border-border bg-muted/40 px-3 py-1 text-xs font-semibold text-foreground">
                      📍 {area}
                    </span>
                  ))}
                </div>
              </div>

              {/* Verified Security Card */}
              <div className="rounded-3xl border border-emerald-200 bg-emerald-50/70 p-6 space-y-3">
                <div className="flex items-center gap-2 text-emerald-900">
                  <ShieldCheck className="h-5 w-5 text-emerald-600" />
                  <h3 className="font-bold text-base">Verified & Fraud Free</h3>
                </div>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  Nyumba.ke validates all property listings and landlord profiles. We will never ask you to send rent money via personal numbers outside the M-Pesa STK push prompt on our official platform.
                </p>
              </div>
            </div>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
