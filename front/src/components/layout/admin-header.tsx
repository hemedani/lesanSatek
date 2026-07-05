"use client"

import { Breadcrumbs } from "@/components/layout/breadcrumbs"
import { AdminMobileNav } from "@/components/layout/admin-sidebar"
import { UserMenu } from "@/components/layout/user-menu"

function AdminHeader() {
  return (
    <header className="glass-header sticky top-0 z-30 flex h-[64px] min-h-[64px] items-center gap-4 px-4 sm:px-6">
      <div className="absolute inset-x-0 top-0 h-24 blueprint-glow pointer-events-none" />
      <AdminMobileNav />
      <Breadcrumbs className="flex-1" />
      <UserMenu />
    </header>
  )
}

export { AdminHeader }
