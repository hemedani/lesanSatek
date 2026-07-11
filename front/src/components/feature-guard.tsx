"use client"

import { useAuthStore } from "@/stores/authStore"
import { AccessDenied } from "@/components/auth/access-denied"

interface FeatureGuardProps {
  feature: string
  fallback?: React.ReactNode
  children: React.ReactNode
}

function FeatureGuard({ feature, fallback, children }: FeatureGuardProps) {
  const { user } = useAuthStore()

  const isEnabled = user?.features?.some((f) => f.feature === feature) ?? false
  const roleNames = user?.roles?.map((r) => r.name) ?? []
  const isSuper = roleNames.some((r) => ["Manager", "Admin", "OrgHead"].includes(r))

  if (isSuper || isEnabled) return <>{children}</>

  return <>{fallback ?? <AccessDenied />}</>
}

export { FeatureGuard }
