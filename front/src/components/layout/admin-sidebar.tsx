"use client"

import { useState, useCallback } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Building2,
  Users,
  GitBranch,
  Tags,
  Workflow,
  ShoppingCart,
  Gavel,
  ClipboardList,
  Receipt,
  FolderTree,
  Layers,
  Grid3X3,
  Cuboid,
  Package,
  Store,
  Box,
  ScrollText,
  Calendar,
  Calculator,
  FileSpreadsheet,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/layout/logo"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
}

interface NavSection {
  label: string
  items: NavItem[]
}

const navSections: NavSection[] = [
  {
    label: "اصلی",
    items: [
      { label: "داشبورد", href: "/admin", icon: LayoutDashboard },
      { label: "سازمان‌ها", href: "/admin/organizations", icon: Building2 },
      { label: "کاربران", href: "/admin/users", icon: Users },
      { label: "واحدها", href: "/admin/units", icon: GitBranch },
      { label: "برچسب‌ها", href: "/admin/tags", icon: Tags },
      { label: "فرآیندها", href: "/admin/processes", icon: Workflow },
    ],
  },
  {
    label: "خرید",
    items: [
      { label: "درخواست‌های خرید", href: "/admin/purchasing-requests", icon: ShoppingCart },
      { label: "مناقصات", href: "/admin/tenders", icon: Gavel },
      { label: "رسید کالا", href: "/admin/goods-receipts", icon: ClipboardList },
      { label: "سفارشات پرداخت", href: "/admin/payment-orders", icon: Receipt },
    ],
  },
  {
    label: "انبار",
    items: [
      { label: "انواع کالا", href: "/admin/ware-types", icon: FolderTree },
      { label: "کلاس کالا", href: "/admin/ware-classes", icon: Layers },
      { label: "گروه کالا", href: "/admin/ware-groups", icon: Grid3X3 },
      { label: "مدل کالا", href: "/admin/ware-models", icon: Cuboid },
      { label: "کالاها", href: "/admin/wares", icon: Package },
      { label: "انبارها", href: "/admin/stores", icon: Store },
      { label: "موجودی", href: "/admin/stuff", icon: Box },
      { label: "مصرف", href: "/admin/consumption", icon: ScrollText },
    ],
  },
  {
    label: "بودجه",
    items: [
      { label: "سال‌های مالی", href: "/admin/fiscal-years", icon: Calendar },
      { label: "ره‌بودجه", href: "/admin/budget-lines", icon: Calculator },
      { label: "گزارش بودجه", href: "/admin/budget-reports", icon: FileSpreadsheet },
    ],
  },
]

function NavItemLink({
  item,
  collapsed,
  onNavigate,
}: {
  item: NavItem
  collapsed: boolean
  onNavigate?: () => void
}) {
  const pathname = usePathname()
  const Icon = item.icon
  const isActive = pathname === item.href || pathname.startsWith(item.href + "/")

  const linkContent = (
    <>
      {isActive && (
        <span className="absolute start-0 top-1/2 -translate-y-1/2 h-6 w-0.5 rounded-full bg-electric-iris shadow-[0_0_8px_rgba(102,58,243,0.5)]" />
      )}
      <Icon
        className={cn(
          "size-5 shrink-0 transition-colors duration-200",
          collapsed ? "ms-0.5" : "ms-0.5",
          isActive ? "text-electric-iris" : "text-fog group-hover:text-glacier",
        )}
      />
      {!collapsed && (
        <span
          className={cn(
            "me-3 text-sm font-medium transition-colors duration-200 truncate leading-5",
            isActive ? "text-frost-link" : "text-moonlight group-hover:text-glacier",
          )}
        >
          {item.label}
        </span>
      )}
    </>
  )

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger
          className={cn(
            "group relative flex items-center justify-center rounded-lg transition-all duration-200 w-full py-3",
            isActive
              ? "bg-electric-iris/10 text-frost-link shadow-[inset_0_0_0_1px_rgba(102,58,243,0.15)]"
              : "text-fog hover:bg-white/[0.04] hover:text-glacier",
          )}
          render={<Link href={item.href} onClick={onNavigate} />}
        >
          {linkContent}
        </TooltipTrigger>
        <TooltipContent side="left" className="text-xs font-medium px-3 py-1.5">
          {item.label}
        </TooltipContent>
      </Tooltip>
    )
  }

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "group relative flex items-center gap-3 rounded-lg transition-all duration-200 px-4 py-2.5 min-h-[44px]",
        isActive
          ? "bg-electric-iris/10 text-frost-link shadow-[inset_0_0_0_1px_rgba(102,58,243,0.15)]"
          : "text-fog hover:bg-white/[0.04] hover:text-glacier",
      )}
    >
      {linkContent}
    </Link>
  )
}

function SidebarContent({
  collapsed,
  onToggle,
  onNavigate,
}: {
  collapsed: boolean
  onToggle: () => void
  onNavigate?: () => void
}) {
  return (
    <div className="flex min-h-0 h-full flex-col">
      {/* Logo / Brand Header */}
      <div className={cn(
        "flex shrink-0 items-center border-b border-steel-border/40 relative",
        collapsed ? "justify-center h-[64px]" : "h-[64px] px-5 justify-between",
      )}>
        {!collapsed && <Logo className="text-lg" />}
        {collapsed && (
          <span className="text-lg font-semibold text-glacier tracking-tight">س</span>
        )}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onToggle}
          className={cn(
            "shrink-0 text-fog hover:text-glacier hover:bg-white/[0.04]",
            collapsed && "absolute -end-3 top-1/2 -translate-y-1/2 z-10 size-6 rounded-full glass-card p-0.5",
          )}
        >
          {collapsed ? <PanelLeft className="size-4" /> : <PanelLeftClose className="size-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 min-h-0">
        <nav className={cn(collapsed ? "px-3 pt-6 pb-6" : "px-3 pt-6 pb-6")}>
          {navSections.map((section, sectionIdx) => (
            <div
              key={section.label}
              className={cn(
                "pb-5 last:pb-0",
                sectionIdx > 0 && "mt-6",
              )}
            >
              {!collapsed && (
                <p
                  className="px-4 pb-2 text-[11px] font-medium text-fog/50 tracking-[0.12em] uppercase leading-4"
                  style={{ fontFeatureSettings: '"tnum"' }}
                >
                  {section.label}
                </p>
              )}
              <div className={cn("space-y-0.5", collapsed && "flex flex-col items-center gap-1")}>
                {section.items.map((item) => (
                  <NavItemLink
                    key={item.href}
                    item={item}
                    collapsed={collapsed}
                    onNavigate={onNavigate}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className={cn(
        "shrink-0 border-t border-steel-border/40 px-5 py-4",
        collapsed && "px-2 flex justify-center",
      )}>
        {!collapsed ? (
          <p className="text-[10px] text-fog/40 tracking-wide text-center leading-4">
            ساتک &copy; ۱۴۰۴
          </p>
        ) : (
          <p className="text-[9px] text-fog/30">©</p>
        )}
      </div>
    </div>
  )
}

function AdminSidebar() {
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("admin-sidebar-collapsed") === "true"
    }
    return false
  })

  const handleToggle = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev
      localStorage.setItem("admin-sidebar-collapsed", String(next))
      return next
    })
  }, [])

  return (
    <aside
      className={cn(
        "hidden lg:flex lg:flex-col glass-sidebar transition-all duration-300 ease-in-out relative z-20 max-h-screen",
        collapsed ? "w-20" : "w-72",
      )}
    >
      <SidebarContent collapsed={collapsed} onToggle={handleToggle} />
    </aside>
  )
}

function AdminMobileNav() {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button variant="ghost" size="icon-sm" className="lg:hidden" />}>
        <PanelLeft className="size-5" />
      </SheetTrigger>
      <SheetContent side="right" className="w-72 p-0 glass-sidebar border-none">
        <SidebarContent collapsed={false} onToggle={() => {}} onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  )
}

export { AdminSidebar, AdminMobileNav }
