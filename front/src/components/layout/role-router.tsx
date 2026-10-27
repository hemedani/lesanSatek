"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { useAuthStore } from "@/stores/authStore"
import { getDefaultPanel } from "@/lib/roles"
import { getMe } from "@/app/actions/auth/getMe"

function RoleRouter({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { user, isAuthenticated, isLoading, setUser, setActiveRoleId, setLoading } = useAuthStore()

  useEffect(() => {
    if (user) return

    const check = async () => {
      setLoading(true)
      const result = await getMe()
      if (result.success && result.body) {
        const activeRoleCookie = document.cookie.replace(/(?:(?:^|.*;\s*)activeRoleId\s*=\s*([^;]*).*$)|^.*$/, "$1")
        if (activeRoleCookie) setActiveRoleId(activeRoleCookie)
        setUser(result.body)
        const defaultPanel = getDefaultPanel(result.body, activeRoleCookie || undefined)
        if (window.location.pathname === "/login" || window.location.pathname === "/register") {
          router.replace(defaultPanel)
        }
      } else {
        setUser(null)
        router.replace("/login")
      }
    }

    check()
  }, [user, setUser, setActiveRoleId, setLoading, router])

  if (isLoading && !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#05060f]">
        <Loader2 className="size-6 animate-spin text-moonlight" />
      </div>
    )
  }

  if (!isAuthenticated) return null

  return <>{children}</>
}

export { RoleRouter }
