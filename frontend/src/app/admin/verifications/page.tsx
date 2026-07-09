"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ShieldCheck, ShieldX, Clock } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";

export default function AdminVerificationsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-verifications"],
    queryFn: () =>
      api.get("/api/admin/verifications") as Promise<{ users: any[] }>,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, verification }: { id: string; verification: string }) =>
      api.patch(`/api/admin/verifications/${id}`, { verification }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-verifications"] });
      toast.success("Verification updated");
    },
  });

  const users = data?.users ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-background">Verifications</h1>
        <p className="mt-1 text-background/50">
          {users.length} pending verification{users.length !== 1 ? "s" : ""}
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-background/5" />
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="rounded-xl border border-background/10 p-12 text-center">
          <ShieldCheck className="mx-auto h-8 w-8 text-background/30" />
          <p className="mt-3 text-background/50">No pending verifications</p>
        </div>
      ) : (
        <div className="space-y-3">
          {users.map((u) => (
            <div
              key={u.id}
              className="flex items-center gap-4 rounded-xl border border-background/10 bg-background/5 p-5"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-yellow-500/20">
                <Clock className="h-5 w-5 text-yellow-400" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-background">{u.fullName}</p>
                <p className="text-xs text-background/50">
                  {u.email} · {u.phone ?? "No phone"} · {u._count.listings} listings ·{" "}
                  Joined {new Date(u.createdAt).toLocaleDateString()}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  size="sm"
                  onClick={() => updateMutation.mutate({ id: u.id, verification: "VERIFIED" })}
                  disabled={updateMutation.isPending}
                  className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Approve
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateMutation.mutate({ id: u.id, verification: "REJECTED" })}
                  disabled={updateMutation.isPending}
                  className="gap-1.5 border-destructive/30 text-destructive hover:bg-destructive/10"
                >
                  <ShieldX className="h-3.5 w-3.5" />
                  Reject
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
