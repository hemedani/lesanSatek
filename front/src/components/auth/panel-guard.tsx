"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { useAuthStore } from "@/stores/authStore"
import { getAccessiblePanels, getDefaultPanel } from "@/lib/roles"
import { getEffectiveFeatures } from "@/lib/features"
import { getMe } from "@/app/actions/auth/getMe"
import { clearSession } from "@/app/actions/auth/clearSession"
import { ACTIVE_ROLE_COOKIE, readClientCookie } from "@/lib/session-cookies"

interface PanelGuardProps {
  children: React.ReactNode
  requiredRoles?: string[]
  requiredFeatures?: string[]
}

function PanelGuard({ children, requiredRoles, requiredFeatures }: PanelGuardProps) {
  const router = useRouter()
  const { user, activeRoleId, isAuthenticated, isLoading, setUser, setLoading } = useAuthStore()
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    if (user || checked) return

    const check = async () => {
      setLoading(true)
      const result = await getMe()
      if (result.success && result.body) {
        const activeRoleCookie = readClientCookie(ACTIVE_ROLE_COOKIE)
        if (activeRoleCookie) {
          const { setActiveRoleId } = useAuthStore.getState()
          setActiveRoleId(activeRoleCookie)
        }
        const panels = getAccessiblePanels(result.body, activeRoleCookie || undefined)
        setUser(result.body, panels)
      } else {
        setUser(null)
        await clearSession()
        router.replace("/login")
      }
      setChecked(true)
    }

    check()
  }, [user, checked, setUser, setLoading, router])

  useEffect(() => {
    if (!isAuthenticated || !user) return

    const roleNames = user.roles?.map((r) => r.name) ?? []
    const featureNames = getEffectiveFeatures(user, activeRoleId)
    const isPrivileged = roleNames.some((r) => ["Manager", "Admin", "OrgHead"].includes(r))

    let authorized = false

    if (requiredRoles && requiredRoles.length > 0) {
      authorized = requiredRoles.some((r) => roleNames.includes(r))
    }
    if (!authorized && requiredFeatures && requiredFeatures.length > 0) {
      authorized = isPrivileged || requiredFeatures.some((f) => featureNames.includes(f))
    }

    if (!authorized) {
      const defaultPanel = getDefaultPanel(user, activeRoleId)
      router.replace(defaultPanel)
    }
  }, [user, activeRoleId, isAuthenticated, requiredRoles, requiredFeatures, router])

  if (isLoading && !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#05060f]">
        <Loader2 className="size-6 animate-spin text-moonlight" />
      </div>
    )
  }

  if (!isAuthenticated && checked) return null

  return <>{children}</>
}

export { PanelGuard }
