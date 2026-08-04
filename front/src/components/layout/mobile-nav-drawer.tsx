"use client"

import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { useNavStore } from "@/stores/navStore"
import { useAuthStore } from "@/stores/authStore"
import { PANEL_NAV, filterNavSections, type PanelId } from "@/lib/nav-config"
import { SidebarBody } from "@/components/layout/sidebar-nav"
import { Menu, X } from "lucide-react"

function MobileNavDrawer({ panel }: { panel: PanelId }) {
  const open = useNavStore((state) => state.mobileOpen)
  const setOpen = useNavStore((state) => state.setMobileOpen)

  const { user } = useAuthStore()
  const roleNames = user?.roles?.map((r) => r.name) ?? []
  const featureNames = user?.features?.map((f) => f.feature) ?? []

  const nav = PANEL_NAV[panel]
  const sections = filterNavSections(nav.sections, roleNames, featureNames)
  const navForRender = { ...nav, sections }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            variant="ghost"
            aria-label="باز کردن منو"
            className="h-10 w-10 rounded-lg text-fog hover:text-glacier hover:bg-white/[0.04] lg:hidden"
          />
        }
      >
        <Menu className="size-6" />
      </SheetTrigger>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="w-[300px] p-0 bg-[rgba(5,6,15,0.92)] backdrop-blur-2xl border-s border-steel-border/30 shadow-2xl"
      >
        <SidebarBody
          nav={navForRender}
          collapsed={false}
          onNavigate={() => setOpen(false)}
          headerEnd={
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="بستن منو"
              onClick={() => setOpen(false)}
              className="size-9 rounded-lg text-fog hover:text-glacier hover:bg-white/[0.04]"
            >
              <X className="size-5" />
            </Button>
          }
        />
      </SheetContent>
    </Sheet>
  )
}

export { MobileNavDrawer }