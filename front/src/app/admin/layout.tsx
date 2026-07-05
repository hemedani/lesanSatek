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
      <div className="admin-canvas-animated relative flex h-screen overflow-hidden">
        {/* Fluid gradient blobs — positioned fixed behind all content */}
        <div
          className="blob fixed start-[8%] top-[-15%] opacity-25"
          style={{
            background:
              "radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, rgba(102, 58, 243, 0.08) 40%, transparent 70%)",
          }}
          aria-hidden="true"
        />
        <div
          className="blob fixed end-[3%] top-[35%] opacity-20"
          style={{
            background:
              "radial-gradient(circle, rgba(186, 207, 247, 0.12) 0%, rgba(186, 207, 247, 0.04) 50%, transparent 70%)",
            animationDelay: "-7s",
          }}
          aria-hidden="true"
        />
        <div
          className="blob fixed start-[55%] bottom-[-8%] opacity-15"
          style={{
            background:
              "radial-gradient(circle, rgba(102, 58, 243, 0.1) 0%, rgba(2, 125, 234, 0.04) 50%, transparent 70%)",
            animationDelay: "-14s",
          }}
          aria-hidden="true"
        />

        <AdminSidebar />

        <div className="relative z-[1] flex flex-1 flex-col overflow-hidden min-h-0">
          <AdminHeader />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 xl:p-10 min-h-0">
            <div className="mx-auto w-full max-w-7xl animate-in fade-in duration-300">
              {children}
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  )
}
