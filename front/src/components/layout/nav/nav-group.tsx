"use client"

import { cn } from "@/lib/utils"
import type { NavSection } from "@/lib/nav-config"
import { NavItemLink } from "@/components/layout/nav/nav-item"

interface NavGroupProps {
  section: NavSection
  collapsed?: boolean
  onNavigate?: () => void
  sectionIndex: number
}

function NavGroup({ section, collapsed = false, onNavigate, sectionIndex }: NavGroupProps) {
  return (
    <div
      className={cn(
        "transition-all duration-200 ease-out",
        sectionIndex > 0 && !collapsed && "mt-7",
        sectionIndex > 0 && collapsed && "mt-5",
      )}
    >
      {!collapsed ? (
        <p
          className="px-4 pb-2 text-[11px] font-medium text-fog/50 tracking-[0.1em] leading-4 overflow-hidden whitespace-nowrap"
          style={{ fontFeatureSettings: '"tnum"' }}
        >
          {section.label}
        </p>
      ) : (
        <div className="flex justify-center pb-2" aria-hidden="true">
          <div className="h-px w-5 bg-steel-border/25" />
        </div>
      )}

      <div
        className={cn(
          "transition-all duration-200 ease-out",
          collapsed ? "flex flex-col items-center gap-1" : "space-y-0.5",
        )}
      >
        {section.items.map((item) => (
          <NavItemLink key={item.href} item={item} collapsed={collapsed} onNavigate={onNavigate} />
        ))}
      </div>
    </div>
  )
}

export { NavGroup }