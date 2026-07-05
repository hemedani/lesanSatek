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
        {/* Fluid gradient blobs — positioned fixed behind all content */}
        <div
          className="blob fixed start-[10%] top-[-20%] opacity-20"
          style={{
            background:
              "radial-gradient(circle, rgba(99, 102, 241, 0.12) 0%, transparent 70%)",
          }}
          aria-hidden="true"
        />
        <div
          className="blob fixed end-[5%] top-[40%] opacity-15"
          style={{
            background:
              "radial-gradient(circle, rgba(186, 207, 247, 0.1) 0%, transparent 70%)",
            animationDelay: "-7s",
          }}
          aria-hidden="true"
        />
        <div
          className="blob fixed start-[60%] bottom-[-10%] opacity-10"
          style={{
            background:
              "radial-gradient(circle, rgba(102, 58, 243, 0.08) 0%, transparent 70%)",
            animationDelay: "-14s",
          }}
          aria-hidden="true"
        />

        <AdminSidebar />

        <div className="relative z-[1] flex flex-1 flex-col overflow-hidden min-h-0">
          <AdminHeader />
          <main className="flex-1 overflow-y-auto p-6 sm:p-9 lg:p-10 min-h-0">
            <div className="mx-auto w-full max-w-[1400px] animate-in fade-in duration-300">
              {children}
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  )
}
