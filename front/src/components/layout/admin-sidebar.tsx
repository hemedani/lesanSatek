"use client"

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
  Package,
  FolderTree,
  Layers,
  Grid3X3,
  Cuboid,
  Store,
  Box,
  ClipboardList,
  Receipt,
  Calculator,
  FileSpreadsheet,
  Gavel,
  ScrollText,
  Calendar,
  Menu,
} from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/layout/logo"

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
}

const mainNav: NavItem[] = [
  { label: "داشبورد", href: "/admin", icon: LayoutDashboard },
  { label: "سازمان‌ها", href: "/admin/organizations", icon: Building2 },
  { label: "کاربران", href: "/admin/users", icon: Users },
  { label: "واحدها", href: "/admin/units", icon: GitBranch },
  { label: "برچسب‌ها", href: "/admin/tags", icon: Tags },
  { label: "فرآیندها", href: "/admin/processes", icon: Workflow },
]

const purchasingNav: NavItem[] = [
  { label: "درخواست‌های خرید", href: "/admin/purchasing-requests", icon: ShoppingCart },
  { label: "مناقصات", href: "/admin/tenders", icon: Gavel },
  { label: "رسید کالا", href: "/admin/goods-receipts", icon: ClipboardList },
  { label: "سفارشات پرداخت", href: "/admin/payment-orders", icon: Receipt },
]

const warehouseNav: NavItem[] = [
  { label: "انواع کالا", href: "/admin/ware-types", icon: FolderTree },
  { label: "کلاس کالا", href: "/admin/ware-classes", icon: Layers },
  { label: "گروه کالا", href: "/admin/ware-groups", icon: Grid3X3 },
  { label: "مدل کالا", href: "/admin/ware-models", icon: Cuboid },
  { label: "کالاها", href: "/admin/wares", icon: Package },
  { label: "انبارها", href: "/admin/stores", icon: Store },
  { label: "موجودی", href: "/admin/stuff", icon: Box },
  { label: "مصرف", href: "/admin/consumption", icon: ScrollText },
]

const financeNav: NavItem[] = [
  { label: "سال‌های مالی", href: "/admin/fiscal-years", icon: Calendar },
  { label: "ره‌بودجه", href: "/admin/budget-lines", icon: Calculator },
  { label: "گزارش بودجه", href: "/admin/budget-reports", icon: FileSpreadsheet },
]

function NavSection({ items }: { items: NavItem[] }) {
  const pathname = usePathname()

  return (
    <div className="space-y-0.5">
      {items.map((item) => {
        const Icon = item.icon
        const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm transition-all duration-200",
              isActive
                ? "shadow-subtle-3 text-electric-iris font-medium border-s-2 border-electric-iris"
                : "text-fog hover:text-moonlight hover:bg-white/[0.03]"
            )}
          >
            <Icon className="size-4 shrink-0" />
            {item.label}
          </Link>
        )
      })}
    </div>
  )
}

function SidebarContent() {
  return (
    <div className="flex h-full flex-col gap-1">
      <div className="flex h-14 items-center px-4 border-b border-steel-border relative after:absolute after:bottom-[-1px] after:inset-x-4 after:h-px after:bg-gradient-to-r after:from-transparent after:via-blueprint-glow/50 after:to-transparent">
        <Logo />
      </div>
      <ScrollArea className="flex-1 px-2 py-3">
        <div className="space-y-5">
          <div>
            <p className="px-2.5 mb-1.5 text-[11px] font-medium text-fog tracking-[0.1em]">اصلی</p>
            <NavSection items={mainNav} />
          </div>
          <div className="pt-1 border-t border-steel-border/40">
            <p className="px-2.5 mb-1.5 text-[11px] font-medium text-fog tracking-[0.1em]">خرید</p>
            <NavSection items={purchasingNav} />
          </div>
          <div className="pt-1 border-t border-steel-border/40">
            <p className="px-2.5 mb-1.5 text-[11px] font-medium text-fog tracking-[0.1em]">انبار</p>
            <NavSection items={warehouseNav} />
          </div>
          <div className="pt-1 border-t border-steel-border/40">
            <p className="px-2.5 mb-1.5 text-[11px] font-medium text-fog tracking-[0.1em]">بودجه</p>
            <NavSection items={financeNav} />
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}

function AdminSidebar() {
  return (
    <aside className="hidden lg:flex lg:w-56 lg:flex-col lg:border-l border-steel-border bg-midnight-ink">
      <SidebarContent />
    </aside>
  )
}

function AdminMobileNav() {
  return (
    <Sheet dir="rtl">
      <SheetTrigger render={<Button variant="ghost" size="icon-sm" className="lg:hidden" />}>
        <Menu className="size-5" />
      </SheetTrigger>
      <SheetContent side="right" className="w-64 p-0">
        <SidebarContent />
      </SheetContent>
    </Sheet>
  )
}

export { AdminSidebar, AdminMobileNav, SidebarContent }
