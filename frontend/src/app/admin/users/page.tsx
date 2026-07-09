"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Search, Trash2, ShieldCheck } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/app/features/auth/hooks/use-auth";

export default function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users", search, role],
    queryFn: () => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (role) params.set("role", role);
      return api.get(`/api/admin/users?${params}`) as Promise<{ users: any[] }>;
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      api.patch(`/api/admin/users/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("User updated");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/admin/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("User deleted");
    },
    onError: (err) => {
      toast.error("Failed", { description: (err instanceof ApiError ? (err.body as any)?.error : "Error") });
    },
  });

  const users = data?.users ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-background">Users</h1>
        <p className="mt-1 text-background/50">{users.length} users found</p>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-background/30" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users..."
            className="pl-9 border-background/20 bg-background/10 text-background placeholder:text-background/30"
          />
        </div>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="rounded-md border border-background/20 bg-background/10 px-3 py-2 text-sm text-background"
        >
          <option value="" className="text-foreground bg-background">All roles</option>
          <option value="TENANT" className="text-foreground bg-background">Tenant</option>
          <option value="LANDLORD" className="text-foreground bg-background">Landlord</option>
          <option value="ADMIN" className="text-foreground bg-background">Admin</option>
        </select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-background/5" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {users.map((u) => (
            <div
              key={u.id}
              className="flex items-center gap-4 rounded-xl border border-background/10 bg-background/5 p-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-background truncate">{u.fullName}</p>
                  {u.isAdmin && (
                    <span className="rounded bg-secondary/20 px-1.5 py-0.5 text-xs text-secondary">admin</span>
                  )}
                  {u.verification === "VERIFIED" && (
                    <ShieldCheck className="h-3.5 w-3.5 text-primary shrink-0" />
                  )}
                </div>
                <p className="text-xs text-background/50 truncate">
                  {u.email} · {u._count.listings} listings · joined {new Date(u.createdAt).toLocaleDateString()}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <select
                  value={u.role}
                  onChange={(e) => updateMutation.mutate({ id: u.id, data: { role: e.target.value } })}
                  className="rounded-md border border-background/20 bg-background/10 px-2 py-1 text-xs text-background"
                >
                  {["TENANT", "LANDLORD", "ADMIN"].map((r) => (
                    <option key={r} value={r} className="text-foreground bg-background">{r}</option>
                  ))}
                </select>
                <select
                  value={u.verification}
                  onChange={(e) => updateMutation.mutate({ id: u.id, data: { verification: e.target.value } })}
                  className="rounded-md border border-background/20 bg-background/10 px-2 py-1 text-xs text-background"
                >
                  {["UNVERIFIED", "PENDING", "VERIFIED", "REJECTED"].map((v) => (
                    <option key={v} value={v} className="text-foreground bg-background">{v}</option>
                  ))}
                </select>
                {u.id !== currentUser?.id && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-destructive/30 text-destructive hover:bg-destructive/10"
                    onClick={() => confirm(`Delete ${u.fullName}?`) && deleteMutation.mutate(u.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
