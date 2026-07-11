"use client"

import { Breadcrumbs } from "@/components/layout/breadcrumbs"
import { AdminMobileNav } from "@/components/layout/admin-sidebar"
import { UserMenu } from "@/components/layout/user-menu"
import { PanelSelector } from "@/components/layout/panel-selector"

function AdminHeader() {
  return (
    <header className="glass-header glass-card-conic-top sticky top-0 z-30 flex h-[64px] min-h-[64px] items-center gap-4 px-4 sm:px-6">
      <AdminMobileNav />
      <Breadcrumbs className="flex-1" />
      <PanelSelector />
      <UserMenu />
    </header>
  )
}

export { AdminHeader }
