"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { useAuthStore } from "@/stores/authStore"
import { getDefaultPanel } from "@/lib/roles"
import { getMe } from "@/app/actions/auth/getMe"

function RoleRouter({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { user, isAuthenticated, isLoading, setUser, setLoading } = useAuthStore()

  useEffect(() => {
    if (user) return

    const check = async () => {
      setLoading(true)
      const result = await getMe()
      if (result.success && result.body) {
        setUser(result.body)
        const defaultPanel = getDefaultPanel(result.body)
        if (window.location.pathname === "/login" || window.location.pathname === "/register") {
          router.replace(defaultPanel)
        }
      } else {
        setUser(null)
        router.replace("/login")
      }
    }

    check()
  }, [user, setUser, setLoading, router])

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
