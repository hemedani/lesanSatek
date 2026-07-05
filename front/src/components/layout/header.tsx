"use client"

import { Logo } from "@/components/layout/logo"
import { UserMenu } from "@/components/layout/user-menu"

function Header() {
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b border-steel-border bg-midnight-ink/80 backdrop-blur-sm px-4 sm:px-6">
      <Logo />
      <div className="flex-1" />
      <UserMenu />
    </header>
  )
}

export { Header }
