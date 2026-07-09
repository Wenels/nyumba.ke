"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import Link from "next/link";
import { CheckCircle2, ExternalLink, Flag } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";

export default function AdminReportsPage() {
  const [resolved, setResolved] = useState("false");
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-reports", resolved],
    queryFn: () =>
      api.get(`/api/admin/reports?resolved=${resolved}`) as Promise<{ reports: any[] }>,
  });

  const resolveMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/api/admin/reports/${id}/resolve`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
      toast.success("Report resolved");
    },
  });

  const reports = data?.reports ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-background">Reports</h1>
        <p className="mt-1 text-background/50">{reports.length} reports</p>
      </div>

      <div className="flex gap-2">
        {[
          { value: "false", label: "Open" },
          { value: "true", label: "Resolved" },
        ].map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setResolved(value)}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
              resolved === value
                ? "border-secondary bg-secondary/20 text-secondary"
                : "border-background/20 text-background/50 hover:border-background/40"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-background/5" />
          ))}
        </div>
      ) : reports.length === 0 ? (
        <div className="rounded-xl border border-background/10 p-12 text-center">
          <Flag className="mx-auto h-8 w-8 text-background/30" />
          <p className="mt-3 text-background/50">No {resolved === "false" ? "open" : "resolved"} reports</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <div
              key={report.id}
              className="rounded-xl border border-background/10 bg-background/5 p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Flag className="h-4 w-4 text-destructive shrink-0" />
                    <p className="font-semibold text-background truncate">
                      {report.listing.title}
                    </p>
                  </div>
                  <p className="mt-1 text-sm text-background/70">
                    <span className="font-medium">Reason:</span> {report.reason}
                  </p>
                  {report.details && (
                    <p className="mt-1 text-sm text-background/50">{report.details}</p>
                  )}
                  <p className="mt-2 text-xs text-background/40">
                    Reported by {report.reportedBy.fullName} ({report.reportedBy.email}) ·{" "}
                    {new Date(report.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link href={`/listings/${report.listing.slug}`} target="_blank">
                    <Button variant="outline" size="sm" className="border-background/20 text-background hover:bg-background/10 gap-1.5">
                      <ExternalLink className="h-3.5 w-3.5" />
                      View
                    </Button>
                  </Link>
                  {!report.resolved && (
                    <Button
                      size="sm"
                      onClick={() => resolveMutation.mutate(report.id)}
                      disabled={resolveMutation.isPending}
                      className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Resolve
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
