import {
  LayoutDashboard,
  Building2,
  Users,
  GitBranch,
  Tags,
  Map,
  MapPin,
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
  Activity,
  ScrollText,
  Calendar,
  Calculator,
  FileSpreadsheet,
  Network,
  Settings,
  Clock,
  FileText,
  Landmark,
  Handshake,
  PlusCircle,
  type LucideIcon,
} from "lucide-react"

export interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  badge?: string
  /** Only visible when the active user holds at least one of these roles. */
  allowedRoles?: string[]
  /** Only visible when the feature flag is present (super roles are exempt). */
  requiredFeature?: string
}

export interface NavSection {
  label: string
  items: NavItem[]
  /** When set, the whole section hides unless the feature flag is present. */
  requiredFeature?: string
}

export interface PanelBrand {
  icon: LucideIcon
  label: string
  description?: string
}

export interface PanelNav {
  id: string
  storageKey: string
  brand: PanelBrand
  sections: NavSection[]
}

export type PanelId =
  | "admin"
  | "orghead"
  | "unit-head"
  | "storehead"
  | "requests"
  | "ordinary"

const adminSections: NavSection[] = [
  {
    label: "اصلی",
    items: [{ label: "داشبورد", href: "/admin", icon: LayoutDashboard }],
  },
  {
    label: "ساختار سازمانی",
    items: [
      { label: "سازمان‌ها", href: "/admin/organizations", icon: Building2 },
      { label: "کاربران", href: "/admin/users", icon: Users },
      { label: "واحدها", href: "/admin/units", icon: GitBranch },
      { label: "برچسب‌ها", href: "/admin/tags", icon: Tags },
      { label: "استان‌ها", href: "/admin/states", icon: Map },
      { label: "شهرها", href: "/admin/cities", icon: MapPin },
    ],
  },
  {
    label: "فرآیندها",
    items: [
      { label: "فرآیندها", href: "/admin/processes", icon: Workflow },
      { label: "درخواست‌های خرید", href: "/admin/purchasing-requests", icon: ShoppingCart },
      { label: "مناقصات", href: "/admin/tenders", icon: Gavel },
      { label: "رسید کالا", href: "/admin/goods-receipts", icon: ClipboardList },
      { label: "دستورات پرداخت", href: "/admin/payment-orders", icon: Receipt },
    ],
  },
  {
    label: "کالا و انبار",
    items: [
      { label: "انواع کالا", href: "/admin/ware-types", icon: FolderTree },
      { label: "کلاس کالا", href: "/admin/ware-classes", icon: Layers },
      { label: "گروه کالا", href: "/admin/ware-groups", icon: Grid3X3 },
      { label: "مدل کالا", href: "/admin/ware-models", icon: Cuboid, allowedRoles: ["StoreHead"] },
      { label: "کالاها", href: "/admin/wares", icon: Package, allowedRoles: ["StoreHead"] },
      { label: "تولیدکنندگان", href: "/admin/manufacturers", icon: Factory },
      { label: "انبارها", href: "/admin/stores", icon: Store, allowedRoles: ["StoreHead"] },
      { label: "موجودی انبار", href: "/admin/inventory", icon: Warehouse, requiredFeature: "canViewWarehouse" },
      { label: "گردش کالا", href: "/admin/stock-movements", icon: Activity, requiredFeature: "canViewWarehouse" },
      { label: "موجودی", href: "/admin/stuff", icon: Box, allowedRoles: ["StoreHead"] },
      { label: "مصرف", href: "/admin/consumption", icon: ScrollText, requiredFeature: "canViewWarehouse" },
    ],
  },
  {
    label: "مالی و بودجه",
    requiredFeature: "canManageBudget",
    items: [
      { label: "سال‌های مالی", href: "/admin/fiscal-years", icon: Calendar },
      { label: "ردیف‌های بودجه", href: "/admin/budget-lines", icon: Calculator },
      { label: "گزارش بودجه", href: "/admin/budget-reports", icon: FileSpreadsheet },
    ],
  },
]

const orgheadSections: NavSection[] = [
  {
    label: "داشبورد",
    items: [{ label: "داشبورد", href: "/orghead", icon: LayoutDashboard }],
  },
  {
    label: "سازمان",
    items: [
      { label: "نمودار سازمان", href: "/orghead/org-chart", icon: Network },
      { label: "واحدها", href: "/orghead/units", icon: GitBranch },
      { label: "کاربران", href: "/orghead/users", icon: Users },
    ],
  },
  {
    label: "فرآیندها",
    items: [{ label: "فرآیندها", href: "/orghead/processes", icon: Workflow }],
  },
  {
    label: "درخواست‌ها",
    items: [
      { label: "درخواست‌های خرید", href: "/orghead/requests", icon: ShoppingCart },
    ],
  },
  {
    label: "انبارداری",
    items: [
      { label: "موجودی", href: "/orghead/inventory", icon: Warehouse },
      { label: "مصرف", href: "/orghead/consumption", icon: ScrollText },
      { label: "گردش کالا", href: "/orghead/stock-movements", icon: Activity },
    ],
  },
  {
    label: "تنظیمات",
    items: [{ label: "تنظیمات", href: "/orghead/settings", icon: Settings }],
  },
]

const unitHeadSections: NavSection[] = [
  {
    label: "داشبورد",
    items: [{ label: "داشبورد", href: "/unit-head", icon: LayoutDashboard }],
  },
  {
    label: "درخواست‌ها",
    items: [
      { label: "درخواست‌های خرید", href: "/unit-head/requests", icon: ShoppingCart },
      { label: "در انتظار تأیید", href: "/unit-head/requests/pending", icon: Clock },
      { label: "پیش‌نویس‌ها", href: "/unit-head/requests/drafts", icon: FileText },
    ],
  },
  {
    label: "مالی",
    items: [
      { label: "بودجه و مالی", href: "/unit-head/finance", icon: Calculator, requiredFeature: "canManageBudget" },
      { label: "ردیف‌های بودجه", href: "/unit-head/finance/budget-lines", icon: FileSpreadsheet, requiredFeature: "canManageBudget" },
      { label: "سال‌های مالی", href: "/unit-head/finance/fiscal-years", icon: Landmark, requiredFeature: "canViewBudgetReports" },
      { label: "دستورات پرداخت", href: "/unit-head/finance/payment-orders", icon: Receipt, requiredFeature: "canIssuePaymentOrder" },
      { label: "گزارش بودجه", href: "/unit-head/finance/budget-reports", icon: FileSpreadsheet, requiredFeature: "canViewBudgetReports" },
    ],
  },
  {
    label: "انبارداری",
    items: [
      { label: "رسید کالا", href: "/unit-head/goods-receipt", icon: ClipboardList },
      { label: "موجودی", href: "/unit-head/inventory", icon: Warehouse },
      { label: "مصرف", href: "/unit-head/consumption", icon: ScrollText },
      { label: "گردش کالا", href: "/unit-head/stock-movements", icon: Activity },
    ],
  },
]

const storeHeadSections: NavSection[] = [
  {
    label: "داشبورد",
    items: [{ label: "داشبورد", href: "/storehead", icon: LayoutDashboard }],
  },
  {
    label: "درخواست‌ها",
    items: [
      { label: "درخواست‌های خرید", href: "/storehead/purchasing-requests", icon: ShoppingCart },
    ],
  },
  {
    label: "مناقصات",
    items: [
      { label: "مناقصات", href: "/storehead/tenders", icon: Gavel },
      { label: "پیشنهادهای من", href: "/storehead/my-offers", icon: Handshake },
    ],
  },
  {
    label: "کالا و انبار",
    items: [
      { label: "فروشگاه", href: "/storehead/store", icon: Store },
      { label: "موجودی کالا", href: "/storehead/stuff", icon: Package },
    ],
  },
]

const requestsSections: NavSection[] = [
  {
    label: "پیش‌خوان",
    items: [{ label: "داشبورد", href: "/requests", icon: LayoutDashboard }],
  },
  {
    label: "درخواست‌ها",
    items: [
      { label: "درخواست‌های من", href: "/requests/my-requests", icon: ShoppingCart },
      { label: "ثبت درخواست جدید", href: "/requests/new", icon: PlusCircle },
    ],
  },
  {
    label: "انبارداری",
    items: [
      { label: "موجودی", href: "/requests/inventory", icon: Warehouse },
      { label: "مصرف", href: "/requests/consumption", icon: ScrollText },
      { label: "گردش کالا", href: "/requests/stock-movements", icon: Activity },
    ],
  },
]

export const PANEL_NAV: Record<PanelId, PanelNav> = {
  admin: {
    id: "admin",
    storageKey: "admin",
    brand: { icon: Building2, label: "پنل مدیریت", description: "مدیریت سامانه" },
    sections: adminSections,
  },
  orghead: {
    id: "orghead",
    storageKey: "orghead",
    brand: { icon: Building2, label: "مدیریت سازمان", description: "پنل رئیس سازمان" },
    sections: orgheadSections,
  },
  "unit-head": {
    id: "unit-head",
    storageKey: "unit-head",
    brand: { icon: Users, label: "مدیریت واحد", description: "پنل رئیس واحد" },
    sections: unitHeadSections,
  },
  storehead: {
    id: "storehead",
    storageKey: "storehead",
    brand: { icon: Warehouse, label: "مدیریت انبار", description: "پنل رئیس فروشگاه" },
    sections: storeHeadSections,
  },
  requests: {
    id: "requests",
    storageKey: "requests",
    brand: { icon: ShoppingCart, label: "درخواست‌های من", description: "ثبت و پیگیری درخواست‌ها" },
    sections: requestsSections,
  },
  ordinary: {
    id: "ordinary",
    storageKey: "ordinary",
    brand: { icon: LayoutDashboard, label: "پروفایل کاربری", description: "پیش‌خوان کاربر" },
    sections: [],
  },
}

const SUPER_ROLES = ["Manager", "Admin", "OrgHead"]

/**
 * Applies role + feature-flag filtering to a nav section tree.
 * Managers / Admins / OrgHeads are always granted everything.
 */
export function filterNavSections(
  sections: NavSection[],
  roleNames: string[],
  featureNames: string[],
): NavSection[] {
  const isSuper = roleNames.some((role) => SUPER_ROLES.includes(role))

  return sections
    .map((section) => {
      if (isSuper) return section

      if (section.requiredFeature && !featureNames.includes(section.requiredFeature)) {
        return null
      }
      const items = section.items.filter((item) => {
        if (item.allowedRoles?.length && !item.allowedRoles.some((role) => roleNames.includes(role))) {
          return false
        }
        if (item.requiredFeature && !featureNames.includes(item.requiredFeature)) {
          return false
        }
        return true
      })
      return items.length > 0 ? { ...section, items } : null
    })
    .filter((section): section is NavSection => section !== null)
}

export function isNavItemActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(href + "/")
}