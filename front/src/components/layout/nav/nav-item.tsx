"use client"

import { memo } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { isNavItemActive, type NavItem } from "@/lib/nav-config"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

interface NavItemLinkProps {
  item: NavItem
  collapsed?: boolean
  onNavigate?: () => void
}

function NavItemLinkComponent({ item, collapsed = false, onNavigate }: NavItemLinkProps) {
  const pathname = usePathname()
  const Icon = item.icon
  const isActive = isNavItemActive(pathname, item.href)

  const link = (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={isActive ? "page" : undefined}
      aria-label={item.label}
      className={cn(
        "group/nav-item relative flex items-center outline-none transition-all duration-150 ease-out focus-visible:ring-2 focus-visible:ring-electric-iris/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        collapsed
          ? "mx-auto h-11 w-11 justify-center rounded-xl"
          : "min-h-12 w-full gap-3 rounded-lg px-4 py-2.5",
        isActive
          ? collapsed
            ? "bg-electric-iris/10 text-frost-link shadow-[inset_0_0_0_1px_rgba(102,58,243,0.25)] shadow-subtle"
            : "bg-electric-iris/10 text-frost-link shadow-[inset_0_0_0_1px_rgba(102,58,243,0.18)]"
          : collapsed
            ? "text-fog/70 hover:bg-white/[0.03] hover:text-glacier"
            : "text-fog hover:bg-white/[0.03] hover:text-glacier",
      )}
    >
      {isActive && !collapsed && (
        <span
          className="absolute start-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-full bg-electric-iris shadow-[0_0_12px_rgba(102,58,243,0.7)] animate-nav-glow-pulse"
          aria-hidden="true"
        />
      )}
      {isActive && collapsed && (
        <span
          className="absolute inset-0 rounded-xl shadow-[inset_0_0_0_1px_rgba(102,58,243,0.3)] animate-nav-glow-pulse"
          aria-hidden="true"
        />
      )}

      <Icon
        className={cn(
          "size-5 shrink-0 transition-colors duration-150 ease-out",
          collapsed && "mx-auto",
          isActive ? "text-electric-iris" : "text-fog/70 group-hover/nav-item:text-glacier",
        )}
        strokeWidth={2}
        aria-hidden="true"
      />

      {!collapsed && (
        <>
          <span
            className={cn(
              "min-w-0 flex-1 truncate text-sm font-medium leading-5 transition-colors duration-150 ease-out",
              isActive ? "text-frost-link" : "text-moonlight group-hover/nav-item:text-glacier",
            )}
          >
            {item.label}
          </span>
          {item.badge && (
            <span
              className={cn(
                "shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold leading-none",
                isActive
                  ? "bg-electric-iris/20 text-frost-link"
                  : "bg-steel-border/30 text-fog",
              )}
            >
              {item.badge}
            </span>
          )}
        </>
      )}
    </Link>
  )

  if (!collapsed) return link

  return (
    <Tooltip>
      <TooltipTrigger render={link} />
      <TooltipContent
        side="left"
        align="center"
        className="text-xs font-medium px-3 py-1.5 bg-graphite-plate/95 backdrop-blur-md border border-steel-border/50 shadow-subtle-4"
      >
        {item.label}
        {item.badge && <span className="text-fog/60"> · {item.badge}</span>}
      </TooltipContent>
    </Tooltip>
  )
}

const NavItemLink = memo(NavItemLinkComponent)

export { NavItemLink }