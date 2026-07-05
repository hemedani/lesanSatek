"use client"

import { Breadcrumbs } from "@/components/layout/breadcrumbs"
import { AdminMobileNav } from "@/components/layout/admin-sidebar"
import { UserMenu } from "@/components/layout/user-menu"

function AdminHeader() {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-steel-border bg-midnight-ink/90 backdrop-blur-md px-4 sm:px-6 relative before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-[rgba(124,145,182,0.4)] before:to-transparent">
      <div className="absolute inset-x-0 top-0 h-24 blueprint-glow pointer-events-none" />
      <AdminMobileNav />
      <Breadcrumbs className="flex-1" />
      <UserMenu />
    </header>
  )
}

export { AdminHeader }
