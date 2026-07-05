import { create } from "zustand";

interface User {
  _id: string;
  first_name: string;
  last_name: string;
  mobile: string;
  email: string;
  is_verified: boolean;
  isActive: boolean;
  isGhost: boolean;
  position?: string;
  avatar?: { _id: string; name: string; url?: string };
  organization?: { _id: string; name: string };
  features: { feature: string }[];
  roles: { roleId: string; name: string; scopeType?: string; scopeId?: string }[];
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  setUser: (user) => set({ user, isAuthenticated: !!user, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
  logout: () => set({ user: null, isAuthenticated: false, isLoading: false }),
}));
