"use client";

import { ShieldCheck, ShieldX, Clock, CheckCircle2, Upload } from "lucide-react";
import { useAuth } from "@/app/features/auth/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { api, ApiError } from "@/lib/api";
import { toast } from "sonner";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

const STEPS = [
  {
    number: "01",
    title: "Upload your ID",
    description: "A clear photo of your national ID or passport.",
  },
  {
    number: "02",
    title: "Pay verification fee",
    description: "Ksh 200 via M-Pesa to cover manual review costs.",
  },
  {
    number: "03",
    title: "Wait for review",
    description: "Our team reviews your ID within 24 hours.",
  },
  {
    number: "04",
    title: "Get verified badge",
    description: "Your listings show a verified badge to tenants.",
  },
];

export default function VerificationPage() {
  const { user, refetchUser } = useAuth();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const status = user?.verification ?? "UNVERIFIED";

  async function handleRequestVerification() {
    setIsSubmitting(true);
    try {
      await api.post("/api/auth/verification/request");
      await refetchUser();
      queryClient.invalidateQueries({ queryKey: ["auth-user"] });
      toast.success("Verification requested!", {
        description: "Our team will review your account within 24 hours.",
      });
    } catch (err) {
      const message =
        err instanceof ApiError
          ? (err.body as { error?: string })?.error
          : "Something went wrong";
      toast.error("Request failed", { description: message });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Verification</h1>
        <p className="mt-1 text-muted-foreground">
          Verified landlords get more trust and visibility from tenants.
        </p>
      </div>

      {/* Current status */}
      <div
        className={`rounded-xl border p-6 ${
          status === "VERIFIED"
            ? "border-primary/20 bg-primary/5"
            : status === "PENDING"
            ? "border-yellow-200 bg-yellow-50"
            : status === "REJECTED"
            ? "border-destructive/20 bg-destructive/5"
            : "border-border bg-card"
        }`}
      >
        <div className="flex items-center gap-4">
          {status === "VERIFIED" ? (
            <ShieldCheck className="h-10 w-10 text-primary shrink-0" />
          ) : status === "PENDING" ? (
            <Clock className="h-10 w-10 text-yellow-600 shrink-0" />
          ) : status === "REJECTED" ? (
            <ShieldX className="h-10 w-10 text-destructive shrink-0" />
          ) : (
            <ShieldX className="h-10 w-10 text-muted-foreground shrink-0" />
          )}

          <div>
            <p className="font-semibold text-lg">
              {status === "VERIFIED"
                ? "You are verified ✓"
                : status === "PENDING"
                ? "Verification under review"
                : status === "REJECTED"
                ? "Verification rejected"
                : "Not verified"}
            </p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {status === "VERIFIED"
                ? "Your listings show a verified badge to tenants."
                : status === "PENDING"
                ? "Our team is reviewing your account. This usually takes 24 hours."
                : status === "REJECTED"
                ? "Your verification was rejected. Please contact support or try again."
                : "Get verified to build trust with tenants and increase inquiries."}
            </p>
          </div>
        </div>
      </div>

      {/* Benefits */}
      {status !== "VERIFIED" && (
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="font-semibold">Why get verified?</h2>
          <div className="mt-4 space-y-3">
            {[
              "Verified badge on all your listings",
              "Higher ranking in search results",
              "More inquiries from tenants",
              "Builds trust — tenants prefer verified landlords",
            ].map((benefit) => (
              <div key={benefit} className="flex items-center gap-3">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                <span className="text-sm">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Steps */}
      {status === "UNVERIFIED" || status === "REJECTED" ? (
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="font-semibold">How verification works</h2>
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
            {STEPS.map(({ number, title, description }) => (
              <div key={number} className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary/10 text-xs font-bold text-secondary">
                  {number}
                </span>
                <div>
                  <p className="font-semibold text-sm">{title}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-lg border border-border bg-muted/30 p-4">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Note:</span> Full
              ID upload and M-Pesa payment will be available soon. For now,
              clicking the button below submits a verification request that our
              team will review manually.
            </p>
          </div>

          <div className="mt-6 flex items-center gap-4">
            <Button
              onClick={handleRequestVerification}
              disabled={isSubmitting}
              className="gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/90"
            >
              <Upload className="h-4 w-4" />
              {isSubmitting ? "Requesting..." : "Request verification"}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
