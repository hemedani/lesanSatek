import { PanelGuard } from "@/components/auth/panel-guard"
import { AmbientBackground } from "@/components/layout/ambient-background"
import { Logo } from "@/components/layout/logo"
import { RoleSelector } from "@/components/layout/role-selector"
import { UserMenu } from "@/components/layout/user-menu"

export default function OrdinaryLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <PanelGuard requiredRoles={["Ordinary"]}>
      <div className="relative flex min-h-screen flex-col bg-[#05060f]">
        <div className="fixed inset-0 -z-10 bg-[#05060f]" aria-hidden="true">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] bg-[length:60px_60px] opacity-40" />
        </div>
        <AmbientBackground />

        <header className="sticky top-0 z-30 flex h-[64px] min-h-[64px] items-center gap-4 px-4 sm:px-6 border-b border-steel-border/30">
          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-lg bg-electric-iris/15">
              <span className="text-sm font-bold text-electric-iris">س</span>
            </div>
            <Logo link={false} />
          </div>
          <div className="flex flex-1 items-center justify-center">
            <h1 className="text-base font-semibold text-glacier">پروفایل کاربری</h1>
          </div>
          <div className="flex items-center gap-2">
            <RoleSelector />
            <UserMenu />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 min-h-0">
          <div className="mx-auto w-full max-w-7xl animate-in fade-in duration-300">
            {children}
          </div>
        </main>
      </div>
    </PanelGuard>
  )
}
