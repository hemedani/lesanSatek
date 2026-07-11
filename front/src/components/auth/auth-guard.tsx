"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

import { getMe } from "@/app/actions/auth/getMe"
import { useAuthStore } from "@/stores/authStore"

function setActiveRoleCookie(roleId: string) {
  document.cookie = `activeRoleId=${encodeURIComponent(roleId)}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { user, isAuthenticated, isLoading, setUser, setActiveRoleId, setLoading } = useAuthStore()
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    if (user || checked) return

    const check = async () => {
      setLoading(true)
      const result = await getMe()
      if (result.success && result.body) {
        const { getAccessiblePanels } = await import("@/lib/roles")
        const panels = getAccessiblePanels(result.body)
        setUser(result.body, panels)
        const firstRole = result.body.roles?.[0]
        if (firstRole && !useAuthStore.getState().activeRoleId) {
          setActiveRoleId(firstRole.roleId)
          setActiveRoleCookie(firstRole.roleId)
        }
      } else {
        setUser(null)
        router.push("/login")
      }
      setChecked(true)
    }

    check()
  }, [user, checked, setUser, setActiveRoleId, setLoading, router])

  if (isLoading && !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#05060f]">
        <Loader2 className="size-6 animate-spin text-moonlight" />
      </div>
    )
  }

  if (!isAuthenticated && checked) {
    return null
  }

  return <>{children}</>
}

export { AuthGuard }
