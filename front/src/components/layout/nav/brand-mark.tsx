"use client"

import Link from "next/link"
import type { PanelBrand } from "@/lib/nav-config"
import { cn } from "@/lib/utils"

interface BrandMarkProps {
  brand: PanelBrand
  collapsed?: boolean
  href?: string
  className?: string
}

function BrandMark({ brand, collapsed = false, href, className }: BrandMarkProps) {
  const BrandIcon = brand.icon

  const content = (
    <span
      className={cn(
        "flex shrink-0 items-center transition-all duration-200 ease-out",
        collapsed ? "justify-center" : "gap-2.5",
        className,
      )}
    >
      <span
        className={cn(
          "relative flex shrink-0 items-center justify-center rounded-xl bg-electric-iris/15 ring-1 ring-inset ring-electric-iris/20 shadow-[0_0_18px_-6px_rgba(102,58,243,0.45)]",
          collapsed ? "size-9" : "size-9",
        )}
        aria-hidden="true"
      >
        <BrandIcon className="size-5 text-electric-iris" strokeWidth={2} />
      </span>
      {!collapsed && (
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-semibold text-glacier tracking-tight">
            {brand.label}
          </span>
          {brand.description && (
            <span className="truncate text-[11px] text-fog/60 leading-normal">{brand.description}</span>
          )}
        </span>
      )}
    </span>
  )

  if (!href) return content

  return (
    <Link href={href} aria-label={brand.label} className="rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-electric-iris/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background">
      {content}
    </Link>
  )
}

export { BrandMark }