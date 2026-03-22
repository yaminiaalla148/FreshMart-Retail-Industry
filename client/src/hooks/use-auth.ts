import { create } from "zustand";
import { persist } from "zustand/middleware";
import { type User, type Branch } from "@shared/schema";
import { api, buildUrl } from "@shared/routes";
import { useMutation, useQuery } from "@tanstack/react-query";

interface AuthState {
  user: User | null;
  branch: Branch | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  setBranch: (branch: Branch) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      branch: null,
      isAuthenticated: false,
      login: (user) => set({ user, isAuthenticated: true }),
      setBranch: (branch) => set({ branch }),
      logout: () => set({ user: null, branch: null, isAuthenticated: false }),
    }),
    { name: "grocery-auth" }
  )
);

export function useLogin() {
  const login = useAuthStore((state) => state.login);
  
  return useMutation({
    mutationFn: async (credentials: { 
      identifier: string; 
      password?: string; 
      role: "customer" | "branch_manager" | "hq_admin";
      branchId?: number;
    }) => {
      const res = await fetch(api.users.login.path, {
        method: api.users.login.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
        credentials: "include",
      });
      
      if (!res.ok) {
        throw new Error("Invalid credentials");
      }
      
      const user = await res.json();
      login(user);
      return user;
    }
  });
}

export function useBranches() {
  return useQuery({
    queryKey: [api.branches.list.path],
    queryFn: async () => {
      try {
        const res = await fetch(api.branches.list.path);
        if (!res.ok) {
          console.error("Failed to fetch branches:", res.status, res.statusText);
          throw new Error(`Failed to fetch branches: ${res.status}`);
        }
        const data = await res.json();
        console.log("Branches loaded:", data);
        return data;
      } catch (error) {
        console.error("Error fetching branches:", error);
        throw error;
      }
    },
    retry: 1,
  });
}

export function useBranch(id: number) {
  return useQuery({
    queryKey: [api.branches.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.branches.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch branch");
      return res.json();
    },
    enabled: !!id,
  });
}

export function useCreateBranch() {
  return useMutation({
    mutationFn: async (data: { name: string; address?: string }) => {
      const res = await fetch(api.branches.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create branch");
      return res.json();
    },
  });
}

export function useDeleteBranch() {
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.branches.delete.path, { id });
      const res = await fetch(url, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error("Failed to delete branch");
    },
  });
}

export function useCreateManager() {
  return useMutation({
    mutationFn: async (data: { username: string; password: string; branchId: number; name?: string }) => {
      const res = await fetch(api.users.createManager.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create manager");
      return res.json();
    },
  });
}

export function useBranchStaff(branchId?: number) {
  return useQuery({
    queryKey: ['/api/branches', branchId, 'staff'],
    queryFn: async () => {
      if (!branchId) return [];
      const res = await fetch(`/api/branches/${branchId}/staff`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch branch staff');
      return res.json();
    },
    enabled: !!branchId,
  });
}
