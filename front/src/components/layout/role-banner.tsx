"use client"

import { useAuthStore } from "@/stores/authStore"
import { getAccessiblePanels } from "@/lib/roles"
import { LayoutDashboard } from "lucide-react"

function RoleBanner() {
  const { user } = useAuthStore()

  if (!user) return null

  const panels = getAccessiblePanels(user)
  if (panels.length <= 1) return null

  return (
    <div className="rounded-sm bg-electric-iris/5 border border-electric-iris/20 px-4 py-3 text-sm text-frost-link">
      <LayoutDashboard className="size-4 inline ms-1.5 -mt-0.5" />
      شما نقش‌های متعددی دارید. برای دسترسی به پنل‌های دیگر از منوی کاربری استفاده کنید.
    </div>
  )
}

export { RoleBanner }
