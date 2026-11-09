"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

import { getMe } from "@/app/actions/auth/getMe"
import { clearSession } from "@/app/actions/auth/clearSession"
import { getDefaultPanel } from "@/lib/roles"
import { ACTIVE_ROLE_COOKIE, readClientCookie } from "@/lib/session-cookies"

function SessionBootstrap({ hasToken }: { hasToken: boolean }) {
  const router = useRouter()

  useEffect(() => {
    if (!hasToken) return

    let cancelled = false

    const check = async () => {
      const result = await getMe()
      if (cancelled) return

      if (result.success && result.body) {
        const activeRoleId = readClientCookie(ACTIVE_ROLE_COOKIE)
        router.replace(getDefaultPanel(result.body, activeRoleId || undefined))
        return
      }

      await clearSession()
    }

    check()

    return () => {
      cancelled = true
    }
  }, [hasToken, router])

  return null
}

export { SessionBootstrap }
