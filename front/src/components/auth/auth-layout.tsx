import type { ReactNode } from "react"

import { Logo } from "@/components/layout/logo"

interface AuthLayoutProps {
  children: ReactNode
}

function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-[#05060f]">
      <div className="fixed inset-0 -z-10" aria-hidden="true">
        <div className="absolute inset-0 bg-blueprint-grid" />
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      <header className="relative z-10 flex items-center justify-center px-6 py-7 md:justify-start md:px-10">
        <Logo className="text-lg" />
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-6 pb-10 pt-4">
        <div className="flex w-full max-w-[480px] flex-col items-stretch">
          {children}
        </div>
      </main>
    </div>
  )
}

export { AuthLayout }