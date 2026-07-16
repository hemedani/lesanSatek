"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

import { getMe } from "@/app/actions/auth/getMe"
import { useAuthStore } from "@/stores/authStore"

const ADMIN_ROLES = ["Manager", "Admin", "OrgHead"]

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
        const { getAccessiblePanels, getDefaultPanel } = await import("@/lib/roles")
        const roleNames = result.body.roles?.map((r: { name: string }) => r.name) ?? []

        if (!roleNames.some((r: string) => ADMIN_ROLES.includes(r))) {
          const defaultPanel = getDefaultPanel(result.body)
          router.replace(defaultPanel)
          return
        }

        const panels = getAccessiblePanels(result.body)
        setUser(result.body, panels)
        const activeRoleCookie = document.cookie.replace(/(?:(?:^|.*;\s*)activeRoleId\s*=\s*([^;]*).*$)|^.*$/, "$1")
        if (activeRoleCookie) {
          const { setActiveRoleId } = useAuthStore.getState()
          setActiveRoleId(activeRoleCookie)
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
