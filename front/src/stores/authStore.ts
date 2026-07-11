import { create } from "zustand";
import type { PanelDef } from "@/lib/roles";

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
  activeRoleId: string;
  accessiblePanels: PanelDef[];
  activePanel: string;
  setUser: (user: User | null, panels?: PanelDef[]) => void;
  setActiveRoleId: (roleId: string) => void;
  setActivePanel: (panel: string) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
  isFeatureEnabled: (feature: string) => boolean;
  getActiveRoleName: () => string | undefined;
  getActiveScope: () => { type: string; id: string } | undefined;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  activeRoleId: "",
  accessiblePanels: [],
  activePanel: "/admin",
  setUser: (user, panels) =>
    set({
      user,
      isAuthenticated: !!user,
      isLoading: false,
      accessiblePanels: panels ?? [],
    }),
  setActiveRoleId: (activeRoleId) => set({ activeRoleId }),
  setActivePanel: (activePanel) => set({ activePanel }),
  setLoading: (isLoading) => set({ isLoading }),
  logout: () =>
    set({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      activeRoleId: "",
      accessiblePanels: [],
      activePanel: "/admin",
    }),
  isFeatureEnabled: (feature) => {
    const { user } = get();
    const roleNames = user?.roles?.map((r) => r.name) ?? [];
    if (roleNames.some((r) => ["Manager", "Admin", "OrgHead"].includes(r)))
      return true;
    return user?.features?.some((f) => f.feature === feature) ?? false;
  },
  getActiveRoleName: () => {
    const { user, activeRoleId } = get();
    return user?.roles?.find((r) => r.roleId === activeRoleId)?.name;
  },
  getActiveScope: () => {
    const { user, activeRoleId } = get();
    const role = user?.roles?.find((r) => r.roleId === activeRoleId);
    if (role?.scopeType && role?.scopeId) {
      return { type: role.scopeType, id: role.scopeId };
    }
    return undefined;
  },
}));
