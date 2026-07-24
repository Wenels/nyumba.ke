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
  const [files, setFiles] = useState<File[]>([]);

  const status = user?.verification ?? "UNVERIFIED";

  async function handleSubmitVerification(e: React.FormEvent) {
    e.preventDefault();
    if (files.length === 0) {
      toast.error("Please select at least one verification document.");
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append("docs", file);
      });

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/auth/verification/docs`,
        {
          method: "POST",
          body: formData,
          credentials: "include",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to upload documents");
      }

      await refetchUser();
      queryClient.invalidateQueries({ queryKey: ["auth-user"] });
      setFiles([]);
      toast.success("Documents uploaded!", {
        description: "Our team will review your documents within 24 hours.",
      });
    } catch (err: any) {
      toast.error("Upload failed", {
        description: err instanceof Error ? err.message : "Something went wrong",
      });
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

          {/* File selector input */}
          <div className="mt-8 space-y-4">
            <label className="block text-sm font-semibold text-foreground">
              Upload Verification Documents (Max 5 files)
            </label>
            
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-xl cursor-pointer bg-muted/20 hover:bg-muted/30 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                  <p className="mb-1 text-sm text-muted-foreground">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground/80">
                    PDF, PNG, JPG or JPEG (Max 10MB per file)
                  </p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  multiple
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={(e) => {
                    if (e.target.files) {
                      const selectedFiles = Array.from(e.target.files);
                      if (files.length + selectedFiles.length > 5) {
                        toast.error("You can upload a maximum of 5 files.");
                        return;
                      }
                      setFiles((prev) => [...prev, ...selectedFiles]);
                    }
                  }}
                />
              </label>
            </div>

            {/* List of selected files */}
            {files.length > 0 && (
              <div className="space-y-2 mt-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Selected Files ({files.length}/5)
                </p>
                <div className="grid grid-cols-1 gap-2">
                  {files.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-muted/45 text-sm"
                    >
                      <span className="truncate max-w-[80%] font-medium text-foreground">
                        {file.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setFiles((prev) => prev.filter((_, i) => i !== idx));
                        }}
                        className="text-xs font-semibold text-destructive hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 rounded-lg border border-border bg-muted/30 p-4">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Note:</span> Please upload clear, readable copies of your verification documents (such as your ID/Passport, Business Registration, or title deed/utility bill for property verification).
            </p>
          </div>

          <div className="mt-6 flex items-center gap-4">
            <Button
              onClick={handleSubmitVerification}
              loading={isSubmitting}
              disabled={files.length === 0}
              className="gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/90 w-full sm:w-auto"
            >
              {!isSubmitting && <Upload className="h-4 w-4" />}
              {isSubmitting ? "Submitting..." : "Submit for Verification"}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
