import { Logo } from "@/components/layout/logo"
import { UserMenu } from "@/components/layout/user-menu"
import { RoleSelector } from "@/components/layout/role-selector"
import { PanelContext } from "@/components/layout/panel-context"
import { AmbientBackground } from "@/components/layout/ambient-background"
import { Breadcrumbs } from "@/components/layout/breadcrumbs"

interface PanelLayoutProps {
  title: string
  description?: string
  children: React.ReactNode
  actions?: React.ReactNode
}

function PanelLayout({ title, description, children, actions }: PanelLayoutProps) {
  return (
    <div className="relative flex min-h-screen flex-col bg-[#05060f]">
      <div className="fixed inset-0 -z-10 bg-[#05060f]" aria-hidden="true">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] bg-[length:60px_60px] opacity-40" />
      </div>
      <AmbientBackground />

      <header className="glass-header glass-card-conic-top sticky top-0 z-30 flex h-[64px] min-h-[64px] items-center gap-2 sm:gap-4 px-3 sm:px-6">
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="flex size-7 sm:size-8 items-center justify-center rounded-lg bg-electric-iris/15">
            <span className="text-xs sm:text-sm font-bold text-electric-iris">س</span>
          </div>
          <Logo link={false} />
        </div>
        <div className="flex flex-1 items-center justify-center gap-1 sm:gap-2 min-w-0 overflow-hidden">
          <Breadcrumbs className="hidden md:flex" />
          <PanelContext />
        </div>
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {actions && <div className="hidden sm:flex">{actions}</div>}
          <RoleSelector />
          <UserMenu />
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-3 sm:p-6 lg:p-8 min-h-0">
        <div className="mx-auto w-full max-w-7xl animate-in fade-in duration-300">
          {/* Mobile breadcrumbs shown below header */}
          <div className="md:hidden mb-4">
            <Breadcrumbs />
          </div>
          {children}
        </div>
      </main>
    </div>
  )
}

export { PanelLayout }
