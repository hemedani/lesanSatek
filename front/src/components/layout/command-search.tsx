"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/stores/authStore"
import { PANEL_NAV, filterNavSections, type PanelId } from "@/lib/nav-config"
import { type PanelDef } from "@/lib/roles"
import { setActiveRole } from "@/app/actions/auth/setActiveRole"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command"
import { Search, CornerDownLeft } from "lucide-react"

function setActiveRoleCookie(roleId: string) {
  document.cookie = `activeRoleId=${encodeURIComponent(roleId)}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`
}

function CommandSearch({ panel }: { panel: PanelId }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const { user, accessiblePanels, setActiveRoleId } = useAuthStore()

  const roleNames = user?.roles?.map((r) => r.name) ?? []
  const featureNames = user?.features?.map((f) => f.feature) ?? []
  const roleKey = roleNames.join(",")
  const featureKey = featureNames.join(",")

  const nav = PANEL_NAV[panel]

  const navItems = useMemo(() => {
    const sections = filterNavSections(nav.sections, roleNames, featureNames)
    return sections.flatMap((section) =>
      section.items.map((item) => ({
        label: item.label,
        href: item.href,
        icon: item.icon,
        group: section.label,
      })),
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nav, roleKey, featureKey])

  const switchablePanels = useMemo(() => {
    const routableIds = new Set(Object.keys(PANEL_NAV))
    return accessiblePanels.filter((p) => routableIds.has(p.id))
  }, [accessiblePanels])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  const go = (href: string) => {
    setOpen(false)
    router.push(href)
  }

  const switchPanel = async (panelDef: PanelDef) => {
    setOpen(false)
    const role = user?.roles?.find((r) => panelDef.requiredRole?.includes(r.name)) ?? user?.roles?.[0]
    if (role) {
      setActiveRoleCookie(role.roleId)
      setActiveRoleId(role.roleId)
      await setActiveRole(role.roleId, role.name)
    }
    router.push(panelDef.path)
  }

  return (
    <>
      <Button
        variant="ghost"
        onClick={() => setOpen(true)}
        aria-label="جستجو در سامانه"
        className="hidden h-10 items-center gap-2.5 rounded-lg border border-steel-border/30 px-3.5 text-fog hover:border-frost-link/25 hover:bg-white/[0.03] hover:text-moonlight sm:flex"
      >
        <Search className="size-5" />
        <span className="text-sm">جستجو...</span>
        <kbd
          className="ms-1 rounded-md border border-steel-border/40 bg-white/[0.03] px-1.5 py-0.5 text-[10px] text-fog/60"
          dir="ltr"
        >
          ⌘K
        </kbd>
      </Button>
      <Button
        variant="ghost"
        onClick={() => setOpen(true)}
        aria-label="جستجو در سامانه"
        className="h-10 w-10 rounded-lg text-fog hover:text-glacier hover:bg-white/[0.04] sm:hidden"
      >
        <Search className="size-5" />
      </Button>

      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="جستجو در سامانه"
        description="جستجو و حرکت سریع بین بخشهای سامانه"
        className="max-w-xl"
      >
        <Command
          dir="rtl"
          className="rounded-xl! border-0 bg-[rgba(47,52,62,0.6)] text-popover-foreground backdrop-blur-2xl"
        >
          <CommandInput placeholder="جستجو در سامانه..." dir="rtl" />
          <CommandList dir="rtl" className="max-h-80">
            <CommandEmpty className="py-8 text-sm text-fog">نتیجهای یافت نشد</CommandEmpty>
            {navItems.length > 0 && (
              <CommandGroup heading="پیمایش">
                {navItems.map((item) => (
                  <CommandItem
                    key={item.href}
                    value={item.href}
                    onSelect={() => go(item.href)}
                    className="gap-3 rounded-lg px-3 py-2.5"
                  >
                    <span className="flex size-7 items-center justify-center rounded-md bg-electric-iris/10 ring-1 ring-inset ring-electric-iris/15">
                      <item.icon className="size-4 text-electric-iris" />
                    </span>
                    <span className="text-sm text-moonlight">{item.label}</span>
                    <span className="ms-auto text-[11px] text-fog/50">{item.group}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {switchablePanels.length > 1 && (
              <>
                <CommandSeparator />
                <CommandGroup heading="تغییر پنل">
                  {switchablePanels.map((panelDef) => (
                    <CommandItem
                      key={panelDef.id}
                      value={`panel-${panelDef.id}`}
                      onSelect={() => switchPanel(panelDef)}
                      className="gap-3 rounded-lg px-3 py-2.5"
                    >
                      <span className="flex size-7 items-center justify-center rounded-md bg-white/[0.03] ring-1 ring-inset ring-steel-border/25">
                        <panelDef.icon className="size-4 text-frost-link" />
                      </span>
                      <span className="text-sm text-moonlight">{panelDef.label}</span>
                      <span className="ms-auto truncate text-[11px] text-fog/50">{panelDef.description}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
          <div className="flex items-center gap-4 border-t border-steel-border/20 px-4 py-2.5 text-[11px] text-fog/50">
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-steel-border/40 bg-white/[0.03] px-1 text-[10px]" dir="ltr">
                ↑↓
              </kbd>
              حرکت
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-steel-border/40 bg-white/[0.03] px-1 text-[10px]" dir="ltr">
                <CornerDownLeft className="inline size-2.5" />
              </kbd>
              انتخاب
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-steel-border/40 bg-white/[0.03] px-1 text-[10px]" dir="ltr">
                Esc
              </kbd>
              خروج
            </span>
            <span className="ms-auto hidden text-fog/40 sm:inline">جستجوی سریع</span>
          </div>
        </Command>
      </CommandDialog>
    </>
  )
}

export { CommandSearch }