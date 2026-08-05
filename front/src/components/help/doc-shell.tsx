import * as React from "react"

import { SiteHeader } from "@/components/marketing/site-header"
import { SiteFooter } from "@/components/marketing/site-footer"

interface DocShellProps {
  children: React.ReactNode
}

function DocShell({ children }: DocShellProps) {
  return (
    <div className="relative flex min-h-screen flex-col bg-[#05060f] overflow-x-hidden">
      <div className="fixed inset-0 -z-10" aria-hidden="true">
        <div className="absolute inset-0 bg-blueprint-grid" />
        <div className="absolute inset-0 blueprint-glow" />
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      <SiteHeader />

      <main className="mx-auto w-full max-w-7xl flex-1 px-6 pb-24 pt-28">{children}</main>

      <SiteFooter />
    </div>
  )
}

export { DocShell }
