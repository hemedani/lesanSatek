"use client"

import { create } from "zustand"

const STORAGE_KEY = "lesan-nav-collapsed-v2"

interface NavState {
  /** Persisted per-panel sidebar collapse state (key = panel id). */
  collapsed: Record<string, boolean>
  /** Mobile drawer open state. */
  mobileOpen: boolean
  /** Global command palette open state. */
  commandOpen: boolean
  isCollapsed: (key: string) => boolean
  toggleCollapsed: (key: string) => void
  setCollapsed: (key: string, value: boolean) => void
  setMobileOpen: (open: boolean) => void
  setCommandOpen: (open: boolean) => void
}

function loadCollapsed(): Record<string, boolean> {
  if (typeof window === "undefined") return {}
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Record<string, boolean>) : {}
  } catch {
    return {}
  }
}

function persistCollapsed(value: Record<string, boolean>) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
  } catch {
    /* storage unavailable — ignore */
  }
}

export const useNavStore = create<NavState>((set, get) => ({
  collapsed: loadCollapsed(),
  mobileOpen: false,
  commandOpen: false,
  isCollapsed: (key) => get().collapsed[key] !== false,
  toggleCollapsed: (key) => {
    const next = { ...get().collapsed, [key]: !get().collapsed[key] }
    set({ collapsed: next })
    persistCollapsed(next)
  },
  setCollapsed: (key, value) => {
    const next = { ...get().collapsed, [key]: value }
    set({ collapsed: next })
    persistCollapsed(next)
  },
  setMobileOpen: (mobileOpen) => set({ mobileOpen }),
  setCommandOpen: (commandOpen) => set({ commandOpen }),
}))