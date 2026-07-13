"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ShieldCheck,
  ShieldX,
  Clock,
  Mail,
  Phone,
  ListChecks,
  Calendar,
} from "lucide-react";
import { api } from "@/lib/api";

interface VerificationDoc {
  id: string;
  url: string;
  docType: string;
}

interface VerificationUser {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  createdAt: string;
  _count?: { listings: number };
  verificationDocs?: VerificationDoc[];
}
import { Button } from "@/components/ui/button";

export default function AdminVerificationsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-verifications"],
    queryFn: () =>
      api.get("/api/admin/verifications") as Promise<{ users: VerificationUser[] }>,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, verification }: { id: string; verification: string }) =>
      api.patch(`/api/admin/verifications/${id}`, { verification }),
    onSuccess: (_, { verification }) => {
      queryClient.invalidateQueries({ queryKey: ["admin-verifications"] });
      toast.success(
        verification === "VERIFIED"
          ? "Landlord verified ✓"
          : "Verification rejected"
      );
    },
  });

  const users = data?.users ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-background">Verifications</h1>
        <p className="mt-1 text-background/50">
          {users.length} pending verification{users.length !== 1 ? "s" : ""} —
          review each landlord before approving
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-xl bg-background/5" />
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="rounded-xl border border-background/10 p-16 text-center">
          <ShieldCheck className="mx-auto h-10 w-10 text-background/30" />
          <p className="mt-4 font-semibold text-background">All caught up</p>
          <p className="mt-1 text-sm text-background/50">
            No pending verifications at this time.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {users.map((u: VerificationUser) => (
            <div
              key={u.id}
              className="rounded-xl border border-background/10 bg-background/5 p-6"
            >
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-yellow-500/20">
                    <Clock className="h-6 w-6 text-yellow-400" />
                  </div>
                  <div>
                    <p className="font-bold text-background text-lg">{u.fullName}</p>
                    <span className="rounded-full bg-yellow-500/20 px-2.5 py-0.5 text-xs font-medium text-yellow-400">
                      PENDING REVIEW
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() =>
                      updateMutation.mutate({ id: u.id, verification: "VERIFIED" })
                    }
                    disabled={updateMutation.isPending}
                    className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      updateMutation.mutate({ id: u.id, verification: "REJECTED" })
                    }
                    disabled={updateMutation.isPending}
                    className="gap-1.5 border-destructive/30 text-destructive hover:bg-destructive/10"
                  >
                    <ShieldX className="h-3.5 w-3.5" />
                    Reject
                  </Button>
                </div>
              </div>

              {/* Full details */}
              <div className="mt-5 grid grid-cols-1 gap-4 border-t border-background/10 pt-5 sm:grid-cols-2 lg:grid-cols-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-background/40 shrink-0" />
                  <div>
                    <p className="text-xs text-background/40">Email</p>
                    <p className="text-sm text-background">{u.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-background/40 shrink-0" />
                  <div>
                    <p className="text-xs text-background/40">Phone</p>
                    <p className="text-sm text-background">
                      {u.phone ?? (
                        <span className="text-background/30">Not provided</span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <ListChecks className="h-4 w-4 text-background/40 shrink-0" />
                  <div>
                    <p className="text-xs text-background/40">Listings</p>
                    <p className="text-sm text-background">
                      {u._count?.listings ?? 0} listing
                      {(u._count?.listings ?? 0) !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-background/40 shrink-0" />
                  <div>
                    <p className="text-xs text-background/40">Joined</p>
                    <p className="text-sm text-background">
                      {new Date(u.createdAt).toLocaleDateString("en-KE", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Uploaded docs */}
              {u.verificationDocs && u.verificationDocs.length > 0 ? (
                <div className="mt-4 border-t border-background/10 pt-4">
                  <p className="text-xs font-semibold text-background/40 uppercase tracking-wide mb-3">
                    Submitted documents
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {u.verificationDocs.map((doc: VerificationDoc) => (
                      <a
                        key={doc.id}
                        href={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}${doc.url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 rounded-lg border border-background/20 bg-background/10 px-3 py-2 text-xs text-background hover:bg-background/20 transition-colors"
                      >
                        📄 {doc.docType}
                      </a>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mt-4 rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-3">
                  <p className="text-xs text-yellow-400">
                    ⚠️ No documents uploaded yet — landlord has not submitted ID or property ownership proof.
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
