"use client"

import { useEffect, useMemo } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { PANEL_NAV, filterNavSections, type PanelId, type PanelNav } from "@/lib/nav-config"
import { useNavStore } from "@/stores/navStore"
import { useAuthStore } from "@/stores/authStore"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { BrandMark } from "@/components/layout/nav/brand-mark"
import { NavGroup } from "@/components/layout/nav/nav-group"
import { ChevronRight, ChevronLeft, Settings, BookOpen } from "lucide-react"

const COLLAPSED_WIDTH = 72
const EXPANDED_WIDTH = 280

const roleLabelMap: Record<string, string> = {
  Manager: "مدیر",
  Admin: "مدیر سیستم",
  Employee: "کارمند",
  Ordinary: "کاربر عادی",
  OrgHead: "رئیس سازمان",
  UnitHead: "رئیس واحد",
  StoreHead: "رئیس فروشگاه",
}

function usePanelNav(panel: PanelId) {
  const { user } = useAuthStore()
  const roleNames = user?.roles?.map((r) => r.name) ?? []
  const featureNames = user?.features?.map((f) => f.feature) ?? []
  const roleKey = roleNames.join(",")
  const featureKey = featureNames.join(",")

  const nav = PANEL_NAV[panel]

  const sections = useMemo(
    () => filterNavSections(nav.sections, roleNames, featureNames),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [nav, roleKey, featureKey],
  )

  return { nav, sections }
}

function resolveEntity(user: NonNullable<ReturnType<typeof useAuthStore.getState>["user"]> | null, activeRoleId: string) {
  const activeRole = user?.roles?.find((r) => r.roleId === activeRoleId)
  let name: string | undefined
  let scopeLabel: string | undefined

  if (activeRole?.scopeType === "unit" && activeRole.scopeId) {
    name = user?.units?.find((u) => u._id === activeRole.scopeId)?.name
    scopeLabel = "واحد"
  } else if (activeRole?.scopeType === "store" && activeRole.scopeId) {
    name = user?.managedStore?._id === activeRole.scopeId ? user.managedStore.name : undefined
    scopeLabel = "فروشگاه"
  } else if (activeRole?.scopeType === "organization" && activeRole.scopeId) {
    name = user?.organizations?.find((o) => o._id === activeRole.scopeId)?.name
    scopeLabel = "سازمان"
  } else {
    name = user?.organizations?.[0]?.name
  }

  const roleLabel = activeRole?.name ? roleLabelMap[activeRole.name] ?? activeRole.name : undefined

  return { name, scopeLabel, roleLabel }
}

function EntityBadge() {
  const { user, activeRoleId } = useAuthStore()
  const entity = resolveEntity(user, activeRoleId)

  if (!entity.name) return null

  const initial = entity.name.trim().charAt(0) || "س"

  return (
    <div className="mx-3 flex items-center gap-3 rounded-xl border border-steel-border/25 bg-white/[0.02] px-3 py-2.5">
      <span
        className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-electric-iris/35 to-frost-link/15 text-sm font-bold text-glacier ring-1 ring-inset ring-frost-link/20 shadow-[0_0_18px_-6px_rgba(102,58,243,0.5)]"
        aria-hidden="true"
      >
        {initial}
      </span>
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-[13px] font-medium text-moonlight tracking-tight">{entity.name}</span>
        <span className="truncate text-[11px] text-fog/60 leading-normal">
          {[entity.scopeLabel, entity.roleLabel].filter(Boolean).join(" · ") || "سازمان"}
        </span>
      </div>
    </div>
  )
}

function SidebarFooter({ nav, collapsed = false, onToggle }: { nav: PanelNav; collapsed?: boolean; onToggle?: () => void }) {
  const settingsHref = useMemo(() => {
    const settingsSection = nav.sections.find((s) => s.label === "تنظیمات")
    return settingsSection?.items[0]?.href
  }, [nav])

  const toggleButton =
    collapsed && onToggle ? (
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggle}
              aria-label="باز کردن منو"
              className="h-10 w-10 rounded-lg text-fog hover:text-glacier hover:bg-white/[0.04]"
            >
              <ChevronLeft className="size-5" />
            </Button>
          }
        />
        <TooltipContent side="left" className="bg-graphite-plate/95 backdrop-blur-md border border-steel-border/50 shadow-subtle-4">
          باز کردن منو (Cmd+B)
        </TooltipContent>
      </Tooltip>
    ) : !collapsed && onToggle ? (
      <Button
        variant="ghost"
        onClick={onToggle}
        aria-label="بستن منو"
        className="flex h-10 w-full items-center gap-2.5 rounded-lg px-3 text-fog hover:text-glacier hover:bg-white/[0.04]"
      >
        <ChevronRight className="size-4.5" />
        <span className="flex-1 text-start text-sm font-medium">بستن منو</span>
        <kbd className="rounded-md border border-steel-border/40 bg-white/[0.03] px-1.5 py-0.5 text-[10px] text-fog/60" dir="ltr">
          ⌘B
        </kbd>
      </Button>
    ) : null

  return (
    <div className="shrink-0 border-t border-steel-border/25 transition-all duration-200 ease-out">
      {(toggleButton || collapsed) && (
        <div className={cn("py-3 transition-all duration-200 ease-out", collapsed ? "px-2" : "px-3")}>
          {toggleButton ?? (
            <p className="py-2 text-center text-[9px] text-fog/30" aria-hidden="true">
              ©
            </p>
          )}
        </div>
      )}

      <div className={cn("border-t border-steel-border/15", collapsed ? "border-t-0" : "")}>
        <div className="px-3 py-2.5">
          {!collapsed && (
            <div className="flex items-center justify-center gap-1">
              {settingsHref && (
                <Link
                  href={settingsHref}
                  className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[11px] text-fog/60 transition-colors hover:bg-white/[0.03] hover:text-moonlight"
                >
                  <Settings className="size-3.5" />
                  تنظیمات
                </Link>
              )}
              <Link
                href="/doc"
                className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[11px] text-fog/60 transition-colors hover:bg-white/[0.03] hover:text-moonlight"
              >
                <BookOpen className="size-3.5" />
                مستندات
              </Link>
            </div>
          )}
          <p className="mt-1 text-center text-[10px] text-fog/40">ساتک © ۱۴۰۴</p>
        </div>
      </div>
    </div>
  )
}

function SidebarBody({
  nav,
  collapsed,
  onToggle,
  onNavigate,
  headerEnd,
}: {
  nav: PanelNav
  collapsed?: boolean
  onToggle?: () => void
  onNavigate?: () => void
  headerEnd?: React.ReactNode
}) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Brand header */}
      <div
        className={cn(
          "relative flex shrink-0 items-center border-b border-steel-border/25 transition-all duration-200 ease-out",
          collapsed ? "h-[72px] justify-center" : "h-[76px] px-5",
        )}
      >
        <BrandMark brand={nav.brand} collapsed={collapsed} href={`/${nav.id}`} />
        {headerEnd && !collapsed && <div className="ms-auto">{headerEnd}</div>}
      </div>

      {!collapsed && <EntityBadge />}

      {/* Navigation */}
      <ScrollArea className="min-h-0 flex-1">
        <nav
          className={cn(
            "transition-all duration-200 ease-out",
            collapsed ? "px-3 pb-5 pt-5" : "px-3 pb-5 pt-5",
          )}
          aria-label="ناوبری اصلی"
        >
          {nav.sections.map((section, index) => (
            <NavGroup key={section.label} section={section} collapsed={collapsed} onNavigate={onNavigate} sectionIndex={index} />
          ))}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <SidebarFooter nav={nav} collapsed={collapsed} onToggle={onToggle} />
    </div>
  )
}

function SidebarNav({ panel }: { panel: PanelId }) {
  const { nav, sections } = usePanelNav(panel)
  const collapsed = useNavStore((state) => state.isCollapsed(nav.storageKey))
  const toggleCollapsed = useNavStore((state) => state.toggleCollapsed)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") {
        e.preventDefault()
        toggleCollapsed(nav.storageKey)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [nav.storageKey, toggleCollapsed])

  const navForRender = { ...nav, sections }

  return (
    <aside
      className="group/sidebar relative z-20 hidden h-screen max-h-screen flex-col overflow-hidden border-e border-steel-border/30 bg-gradient-to-b from-[#2f343e]/60 to-[#2a2f38]/70 shadow-[inset_0_0_1px_0_rgba(186,215,247,0.06)] backdrop-blur-xl transition-[width] duration-200 ease-out lg:flex"
      style={{ width: collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH }}
      aria-label="منوی کناری"
    >
      <SidebarBody nav={navForRender} collapsed={collapsed} onToggle={() => toggleCollapsed(nav.storageKey)} />
    </aside>
  )
}

export { SidebarNav, SidebarBody }