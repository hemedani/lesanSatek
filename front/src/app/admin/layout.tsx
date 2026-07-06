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
      <div className="relative flex h-screen overflow-hidden bg-[#05060f]">
        {/* Static canvas — purely GPU-accelerated, no animation repaints */}
        <div className="fixed inset-0 -z-10 bg-[#05060f]" aria-hidden="true">
          <div className="absolute bottom-0 left-1/2 h-[600px] w-[800px] -translate-x-1/2 translate-y-1/3 rounded-full bg-[#663af3]/5 blur-3xl will-change-transform" />
          <div className="absolute right-0 top-0 h-[400px] w-[600px] rounded-full bg-[#3b8bfd]/6 blur-3xl will-change-transform" />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] bg-[length:60px_60px] opacity-40" />
        </div>

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
