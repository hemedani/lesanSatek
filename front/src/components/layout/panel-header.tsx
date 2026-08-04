"use client"

import { cn } from "@/lib/utils"
import { PANEL_NAV, type PanelId } from "@/lib/nav-config"
import { Breadcrumbs } from "@/components/layout/breadcrumbs"
import { PanelContext } from "@/components/layout/panel-context"
import { RoleSelector } from "@/components/layout/role-selector"
import { UserMenu } from "@/components/layout/user-menu"
import { CommandSearch } from "@/components/layout/command-search"
import { BrandMark } from "@/components/layout/nav/brand-mark"

interface PanelHeaderProps {
  panel: PanelId
  /** Hamburger trigger for the mobile drawer — rendered below lg. */
  mobileTrigger?: React.ReactNode
  /** Show the brand mark on desktop (true when there is no sidebar). */
  showBrand?: boolean
  /** Extra actions rendered before the search button. */
  actions?: React.ReactNode
  className?: string
}

function PanelHeader({ panel, mobileTrigger, showBrand = false, actions, className }: PanelHeaderProps) {
  const nav = PANEL_NAV[panel]

  return (
    <header
      className={cn(
        "glass-card-conic-top sticky top-0 z-30 flex min-h-16 items-center gap-3 border-b border-steel-border/30 bg-[#05060f]/80 px-4 shadow-[0_1px_0_0_rgba(255,255,255,0.05)] backdrop-blur-xl sm:min-h-[68px] sm:gap-4 sm:px-6 lg:gap-5 lg:px-8",
        className,
      )}
    >
      {mobileTrigger}

      {showBrand && <BrandMark brand={nav.brand} className="shrink-0" />}

      <div className="flex min-w-0 flex-1 items-center gap-1 sm:gap-2">
        <Breadcrumbs className="hidden md:flex" />
      </div>

      {actions && <div className="hidden shrink-0 items-center gap-2 sm:flex">{actions}</div>}

      <div className="flex shrink-0 items-center gap-2 sm:gap-2.5 lg:gap-3">
        <CommandSearch panel={panel} />
        <PanelContext />
        <RoleSelector />
        <UserMenu />
      </div>
    </header>
  )
}

export { PanelHeader }
