"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

import { getMe } from "@/app/actions/auth/getMe"
import { useAuthStore } from "@/stores/authStore"

function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { user, isAuthenticated, isLoading, setUser, setLoading } = useAuthStore()
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    if (user || checked) return

    const check = async () => {
      setLoading(true)
      const result = await getMe()
      if (result.success && result.body) {
        setUser(result.body)
      } else {
        setUser(null)
        router.push("/login")
      }
      setChecked(true)
    }

    check()
  }, [user, checked, setUser, setLoading, router])

  if (isLoading && !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-midnight-ink">
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
