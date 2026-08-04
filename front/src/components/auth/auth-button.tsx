"use client"

import type { LucideIcon } from "lucide-react"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface AuthButtonProps {
  type?: "submit" | "button"
  loading?: boolean
  loadingText?: string
  icon?: LucideIcon
  children: React.ReactNode
  className?: string
}

function AuthButton({
  type = "submit",
  loading = false,
  loadingText,
  icon: Icon,
  children,
  className,
}: AuthButtonProps) {
  return (
    <Button
      type={type}
      disabled={loading}
      className={cn(
        "group/btn relative h-[48px] w-full mt-6 gap-2.5 rounded-lg bg-electric-iris text-base font-semibold text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.14),0_0_32px_-10px_rgba(102,58,243,0.55)] transition-all duration-200 hover:bg-electric-iris/90 hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.18),0_0_44px_-8px_rgba(102,58,243,0.75)] focus-visible:ring-4 focus-visible:ring-electric-iris/25 disabled:opacity-70 disabled:saturate-75",
        className
      )}
    >
      {loading ? (
        <>
          <Loader2 className="size-5 animate-spin" aria-hidden="true" />
          <span>{loadingText ?? children}</span>
        </>
      ) : (
        <>
          {Icon && <Icon className="size-5 shrink-0" aria-hidden="true" />}
          <span>{children}</span>
        </>
      )}
    </Button>
  )
}

export { AuthButton }
