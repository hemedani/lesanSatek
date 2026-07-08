"use client";

import { useAuthStore } from "@/stores/authStore";

export const getActiveRoleIdFromStore = (): string => {
  return useAuthStore.getState().activeRoleId;
};
