"use client"

import { PANEL_NAV, type PanelId } from "@/lib/nav-config"
import { AmbientBackground } from "@/components/layout/ambient-background"
import { SidebarNav } from "@/components/layout/sidebar-nav"
import { MobileNavDrawer } from "@/components/layout/mobile-nav-drawer"
import { PanelHeader } from "@/components/layout/panel-header"
import { Breadcrumbs } from "@/components/layout/breadcrumbs"

const DOT_GRID =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+"

interface PanelShellProps {
  panel: PanelId
  children: React.ReactNode
  actions?: React.ReactNode
}

function PanelShell({ panel, children, actions }: PanelShellProps) {
  const nav = PANEL_NAV[panel]
  const hasSidebar = nav.sections.length > 0

  return (
    <div className="relative flex h-screen overflow-hidden bg-[#05060f]">
      {/* Static canvas — midnight ink + dot-grid texture */}
      <div className="fixed inset-0 -z-10 bg-[#05060f]" aria-hidden="true">
        <div
          className="absolute inset-0 bg-[length:60px_60px] opacity-40"
          style={{ backgroundImage: `url("${DOT_GRID}")` }}
        />
      </div>

      {/* Ambient orbs */}
      <AmbientBackground />

      {hasSidebar && <SidebarNav panel={panel} />}

      <div className="relative z-[1] flex min-h-0 flex-1 flex-col overflow-hidden">
        <PanelHeader
          panel={panel}
          mobileTrigger={hasSidebar ? <MobileNavDrawer panel={panel} /> : undefined}
          showBrand={!hasSidebar}
          actions={actions}
        />
        <main className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-7xl animate-in fade-in duration-300">
            <div className="mb-4 md:hidden">
              <Breadcrumbs />
            </div>
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

export { PanelShell }