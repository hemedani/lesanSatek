import { AdminSidebar } from "@/components/layout/admin-sidebar"
import { AdminHeader } from "@/components/layout/admin-header"
import { AuthGuard } from "@/components/auth/auth-guard"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard>
      <div className="admin-canvas relative flex h-screen overflow-hidden">
        {/* Fluid gradient blob — positioned fixed behind all content */}
        <div
          className="blob fixed start-[10%] top-[-20%] opacity-30"
          style={{
            background:
              "radial-gradient(circle, rgba(99, 102, 241, 0.2) 0%, transparent 70%)",
          }}
          aria-hidden="true"
        />
        <div
          className="blob fixed end-[5%] top-[40%] opacity-20"
          style={{
            background:
              "radial-gradient(circle, rgba(186, 207, 247, 0.15) 0%, transparent 70%)",
            animationDelay: "-7s",
          }}
          aria-hidden="true"
        />
        <AdminSidebar />
        <div className="relative z-[1] flex flex-1 flex-col overflow-hidden">
          <AdminHeader />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 animate-in fade-in duration-300">
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  )
}
