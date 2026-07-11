"use client";

import { useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
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
  Factory,
  Store,
  Warehouse,
  Box,
  ScrollText,
  Calendar,
  Calculator,
  FileSpreadsheet,
  PanelLeftClose,
  PanelLeft,
  Map,
  MapPin,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/layout/logo";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    label: "اصلی",
    items: [
      { label: "داشبورد", href: "/admin", icon: LayoutDashboard },
      { label: "سازمان‌ها", href: "/admin/organizations", icon: Building2 },
      { label: "کاربران", href: "/admin/users", icon: Users },
      { label: "واحد‌ها", href: "/admin/units", icon: GitBranch },
      { label: "برچسب‌ها", href: "/admin/tags", icon: Tags },
      { label: "فرآیند‌ها", href: "/admin/processes", icon: Workflow },
      { label: "استان‌ها", href: "/admin/states", icon: Map },
      { label: "شهر‌ها", href: "/admin/cities", icon: MapPin },
    ],
  },
  {
    label: "خرید",
    items: [
      { label: "درخواست‌های خرید", href: "/admin/purchasing-requests", icon: ShoppingCart },
      { label: "مناقصات", href: "/admin/tenders", icon: Gavel },
      { label: "رسید کالا", href: "/admin/goods-receipts", icon: ClipboardList },
      { label: "دستورات پرداخت", href: "/admin/payment-orders", icon: Receipt },
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
      { label: "تولیدکنندگان", href: "/admin/manufacturers", icon: Factory },
      { label: "انبارها", href: "/admin/stores", icon: Store },
      { label: "موجودی انبار", href: "/admin/inventory", icon: Warehouse },
      { label: "موجودی", href: "/admin/stuff", icon: Box },
      { label: "مصرف", href: "/admin/consumption", icon: ScrollText },
    ],
  },
  {
    label: "بودجه",
    items: [
      { label: "سال‌های مالی", href: "/admin/fiscal-years", icon: Calendar },
      { label: "ردیف‌های بودجه", href: "/admin/budget-lines", icon: Calculator },
      { label: "گزارش بودجه", href: "/admin/budget-reports", icon: FileSpreadsheet },
    ],
  },
];

function NavItemLink({
  item,
  collapsed,
  onNavigate,
}: {
  item: NavItem;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const Icon = item.icon;
  const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

  const link = (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "group relative flex items-center transition-all duration-300 ease-out",
        collapsed
          ? "justify-center w-[44px] h-[44px] mx-auto rounded-xl"
          : "gap-3 w-full px-4 py-2.5 min-h-[44px] rounded-lg",
        isActive
          ? collapsed
            ? "bg-electric-iris/10 text-frost-link ring-1 ring-inset ring-electric-iris/20 shadow-subtle"
            : "bg-electric-iris/8 text-frost-link"
          : collapsed
            ? "text-fog/70 hover:text-glacier hover:bg-white/[0.03]"
            : "text-fog hover:text-glacier hover:bg-white/[0.03]",
      )}
    >
      {/* Active indicator — vertical bar for expanded, glow for collapsed */}
      {isActive && !collapsed && (
        <span className="absolute start-0 top-1/2 -translate-y-1/2 h-5 w-[2px] rounded-full bg-electric-iris shadow-[0_0_10px_rgba(102,58,243,0.6)]" />
      )}
      {isActive && collapsed && (
        <span className="absolute inset-0 rounded-xl ring-1 ring-inset ring-electric-iris/30 shadow-[0_0_12px_rgba(102,58,243,0.15)]" />
      )}

      <Icon
        className={cn(
          "size-5 shrink-0 transition-all duration-300 ease-out",
          !collapsed && "ms-0.5",
          isActive ? "text-electric-iris" : "text-fog/70 group-hover:text-glacier",
        )}
      />

      {!collapsed && (
        <span
          className={cn(
            "text-sm font-medium transition-all duration-300 ease-out truncate leading-5",
            isActive ? "text-frost-link" : "text-moonlight group-hover:text-glacier",
          )}
        >
          {item.label}
        </span>
      )}
    </Link>
  );

  if (!collapsed) return link;

  return (
    <Tooltip>
      <TooltipTrigger render={link} />
      <TooltipContent
        side="left"
        className="text-xs font-medium px-3 py-1.5 bg-graphite-plate/95 backdrop-blur-md border border-steel-border/50 shadow-subtle-4"
      >
        {item.label}
      </TooltipContent>
    </Tooltip>
  );
}

const COLLAPSED_WIDTH = 68;

function SidebarContent({
  collapsed,
  onToggle,
  onNavigate,
  sections,
}: {
  collapsed: boolean;
  onToggle: () => void;
  onNavigate?: () => void;
  sections: NavSection[];
}) {
  return (
    <div className="flex min-h-0 h-full flex-col">
      {/* Logo / Brand Header */}
      <div
        className={cn(
          "flex shrink-0 items-center border-b border-steel-border/30 relative transition-all duration-300 ease-out",
          collapsed ? "justify-center h-[60px]" : "h-[64px] px-5 justify-between",
        )}
      >
        {!collapsed ? (
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="size-7 rounded-lg bg-electric-iris/15 flex items-center justify-center shrink-0">
              <span className="text-sm font-bold text-electric-iris">س</span>
            </span>
            <span className="text-base font-semibold text-glacier tracking-tight whitespace-nowrap opacity-100 transition-all duration-300 ease-out">
              ساتک
            </span>
          </div>
        ) : (
          <div className="flex items-center justify-center w-full overflow-hidden">
            <span className="size-7 rounded-lg bg-electric-iris/15 flex items-center justify-center shrink-0">
              <span className="text-sm font-bold text-electric-iris">س</span>
            </span>
          </div>
        )}

        {/* Toggle button — always visible on hover area */}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onToggle}
          className={cn(
            "shrink-0 text-fog/50 hover:text-glacier hover:bg-white/[0.04] transition-all duration-300 ease-out",
            collapsed
              ? "absolute -end-3 top-1/2 -translate-y-1/2 z-10 size-5 rounded-full bg-graphite-plate/80 backdrop-blur-md border border-steel-border/30 shadow-sm p-0"
              : "opacity-0 group-hover/sidebar:opacity-100",
          )}
        >
          {collapsed ? <PanelLeft className="size-3" /> : <PanelLeftClose className="size-4" />}
        </Button>
      </div>

      {/* Blueprint glow divider below logo */}
      <div className="h-px bg-gradient-to-r from-transparent via-frost-link/10 to-transparent mx-5" />

      {/* Navigation */}
      <ScrollArea className="flex-1 min-h-0">
        <nav
          className={cn(
            "transition-all duration-300 ease-out",
            collapsed ? "px-3 pt-5 pb-5" : "px-3 pt-5 pb-5",
          )}
        >
          {sections.map((section, sectionIdx) => (
            <div
              key={section.label}
              className={cn(
                "transition-all duration-300 ease-out",
                sectionIdx > 0 && !collapsed && "mt-6",
                sectionIdx > 0 && collapsed && "mt-5",
              )}
            >
              {!collapsed ? (
                <p
                  className="px-4 pb-2 text-[11px] font-medium text-fog/50 tracking-[0.1em] leading-4 overflow-hidden whitespace-nowrap opacity-100 transition-all duration-300 ease-out"
                  style={{ fontFeatureSettings: '"tnum"' }}
                >
                  {section.label}
                </p>
              ) : (
                <div className="flex justify-center pb-2">
                  <div className="w-4 h-px bg-steel-border/20" />
                </div>
              )}

              <div
                className={cn(
                  "transition-all duration-300 ease-out",
                  collapsed ? "flex flex-col items-center gap-1" : "space-y-0.5",
                )}
              >
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
      <div
        className={cn(
          "shrink-0 border-t border-steel-border/30 transition-all duration-300 ease-out",
          collapsed ? "px-2 py-3 flex justify-center" : "px-5 py-4",
        )}
      >
        {!collapsed ? (
          <p className="text-[10px] text-fog/40 tracking-wide text-center leading-4 whitespace-nowrap opacity-100 transition-all duration-300 ease-out">
            ساتک &copy; ۱۴۰۴
          </p>
        ) : (
          <p className="text-[9px] text-fog/30 leading-3">©</p>
        )}
      </div>
    </div>
  );
}

function AdminSidebar() {
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("admin-sidebar-collapsed") === "true";
    }
    return false;
  });

  const { user } = useAuthStore()

  const roleNames = user?.roles?.map((r) => r.name) ?? []
  const featureNames = user?.features?.map((f) => f.feature) ?? []
  const isSuper = roleNames.some((r) => ["Manager", "Admin", "OrgHead"].includes(r))

  const filteredSections = useMemo(() => {
    if (isSuper) return navSections
    return navSections.filter((section) => {
      if (section.label === "بودجه") {
        return featureNames.includes("canManageBudget")
      }
      if (section.label === "انبار") {
        return featureNames.includes("canViewWarehouse")
      }
      return true
    })
  }, [isSuper, featureNames.join(",")])

  const handleToggle = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("admin-sidebar-collapsed", String(next));
      return next;
    });
  }, []);

  return (
    <aside
      className="group/sidebar hidden lg:flex lg:flex-col glass-sidebar transition-all duration-300 ease-out relative z-20 max-h-screen"
      style={{ width: collapsed ? COLLAPSED_WIDTH : 288 }}
    >
      <SidebarContent collapsed={collapsed} onToggle={handleToggle} sections={filteredSections} />
    </aside>
  );
}

function AdminMobileNav() {
  const [open, setOpen] = useState(false);
  const { user } = useAuthStore()

  const roleNames = user?.roles?.map((r) => r.name) ?? []
  const featureNames = user?.features?.map((f) => f.feature) ?? []
  const isSuper = roleNames.some((r) => ["Manager", "Admin", "OrgHead"].includes(r))

  const filteredSections = useMemo(() => {
    if (isSuper) return navSections
    return navSections.filter((section) => {
      if (section.label === "بودجه") {
        return featureNames.includes("canManageBudget")
      }
      if (section.label === "انبار") {
        return featureNames.includes("canViewWarehouse")
      }
      return true
    })
  }, [isSuper, featureNames.join(",")])

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            className="lg:hidden rounded-lg text-fog hover:text-glacier hover:bg-white/[0.04] transition-all duration-200"
          />
        }
      >
        <PanelLeft className="size-5" />
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-72 p-0 bg-[rgba(5,6,15,0.92)] backdrop-blur-2xl border-s border-steel-border/30 shadow-2xl"
      >
        <SidebarContent collapsed={false} onToggle={() => {}} onNavigate={() => setOpen(false)} sections={filteredSections} />
      </SheetContent>
    </Sheet>
  );
}

export { AdminSidebar, AdminMobileNav };
