"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ApiError, api } from "@/lib/api";

export interface User {
  id: string;
  email: string;
  phone?: string | null;
  fullName: string;
  role: "TENANT" | "LANDLORD" | "ADMIN";
  isAdmin: boolean;
  phoneVerified: boolean;
  verification: "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED";
  avatarUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface AuthResponse {
  user: User;
}

export function useAuth() {
  const queryClient = useQueryClient();
  const router = useRouter();

  // Query to fetch the currently authenticated user
  const {
    data: user,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<User | null, ApiError>({
    queryKey: ["auth-user"],
    queryFn: async () => {
      try {
        const response = (await api.get("/api/auth/me")) as AuthResponse;
        return response.user;
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          // Not logged in is a valid state, return null instead of throwing
          return null;
        }
        throw err;
      }
    },
    // Keep user state fresh, but don't spam requests
    staleTime: 5 * 60 * 1000,
    retry: (failureCount, error) => {
      // Don't retry if the backend explicitly says 401 (not logged in)
      if (error?.status === 401) return false;
      return failureCount < 3;
    },
  });

  // Login mutation with strict portal role enforcement
  const loginMutation = useMutation({
    mutationFn: async (credentials: Record<string, unknown>) => {
      const { expectedRole, ...loginPayload } = credentials;
      const response = (await api.post(
        "/api/auth/login",
        loginPayload,
      )) as AuthResponse;

      const newUser = response.user;

      // Strict role verification based on expected portal role
      if (expectedRole === "LANDLORD" && newUser.role !== "LANDLORD" && newUser.role !== "ADMIN") {
        await api.post("/api/auth/logout").catch(() => {});
        throw new ApiError(403, {
          error: "Access Denied: This is the Landlord Login portal. Your account is registered as a Tenant.",
        });
      }

      if (expectedRole === "TENANT" && newUser.role !== "TENANT") {
        await api.post("/api/auth/logout").catch(() => {});
        throw new ApiError(403, {
          error: "Access Denied: This is the Tenant Login portal. Your account is registered as a Landlord.",
        });
      }

      return newUser;
    },
    onSuccess: (newUser, variables) => {
      // Optimistically update the cache
      queryClient.setQueryData(["auth-user"], newUser);

      // Check if custom redirect URL was requested (e.g. return to property listing)
      const targetRedirect = variables?.redirectTo as string | undefined;
      if (targetRedirect && targetRedirect.startsWith("/")) {
        router.push(targetRedirect);
        router.refresh();
        return;
      }

      // Redirect to the appropriate dashboard based on role
      if (newUser.role === "ADMIN") {
        router.push("/admin/dashboard");
      } else if (newUser.role === "LANDLORD") {
        router.push("/dashboard");
      } else if (newUser.role === "TENANT") {
        router.push("/tenant");
      } else {
        router.push("/browse");
      }
      router.refresh();
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const response = (await api.post(
        "/api/auth/register",
        data,
      )) as AuthResponse;
      return response.user;
    },
    onSuccess: async () => {
      // Clear the query user cache since we want them to log in manually
      queryClient.setQueryData(["auth-user"], null);
      try {
        // Destroy the auto-created session on the backend
        await api.post("/api/auth/logout");
      } catch (err) {
        // Ignore silent error
      }
      toast.success("Account created successfully!", {
        description: "Please sign in to access your dashboard.",
      });
      router.push("/login");
      router.refresh();
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await api.post("/api/auth/logout");
    },
    onSuccess: () => {
      // Reset auth cache and redirect to homepage
      queryClient.setQueryData(["auth-user"], null);
      toast.success("Signed out", {
        description: "You've been logged out successfully.",
      });
      router.push("/");
      router.refresh();
    },
    onError: () => {
      toast.error("Logout failed", { description: "Please try again." });
    },
  });

  return {
    user: user ?? null,
    isLoading,
    isAuthenticated: !!user,
    isError,
    error,
    refetchUser: refetch,

    // Auth operations
    login: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error,

    register: registerMutation.mutateAsync,
    isRegistering: registerMutation.isPending,
    registerError: registerMutation.error,

    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
  };
}
