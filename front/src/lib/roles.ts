import {
  LayoutDashboard,
  GitBranch,
  ShoppingCart,
  Calculator,
  Store,
  type LucideIcon,
} from "lucide-react"

export interface PanelDef {
  id: string
  path: string
  label: string
  icon: LucideIcon
  description: string
  requiredRole?: string[]
  requiredFeature?: string[]
}

export const PANEL_DEFINITIONS: PanelDef[] = [
  {
    id: "admin",
    path: "/admin",
    label: "مدیریت",
    icon: LayoutDashboard,
    description: "مدیریت کامل سامانه",
    requiredRole: ["Manager", "Admin", "OrgHead"],
  },
  {
    id: "unit-head",
    path: "/unit-head",
    label: "پنل واحد",
    icon: GitBranch,
    description: "تایید درخواست‌های خرید واحد",
    requiredRole: ["UnitHead"],
  },
  {
    id: "requests",
    path: "/requests",
    label: "درخواست‌ها",
    icon: ShoppingCart,
    description: "ثبت و پیگیری درخواست‌های خرید",
    requiredRole: ["Employee"],
  },
  {
    id: "ordinary",
    path: "/ordinary",
    label: "پیش‌خوان",
    icon: LayoutDashboard,
    description: "صفحه اصلی کاربران عادی",
    requiredRole: ["Ordinary"],
  },
  {
    id: "finance",
    path: "/finance",
    label: "مالی",
    icon: Calculator,
    description: "مدیریت بودجه و پرداخت‌ها",
    requiredFeature: ["canManageBudget"],
  },
  {
    id: "vendor",
    path: "/vendor",
    label: "فروشندگان",
    icon: Store,
    description: "مناقصات و پیشنهادهای فروش",
    requiredFeature: ["canRespondToTender"],
  },
]

function getUserRoleNames(
  user: { roles?: { name: string }[] },
): string[] {
  return user.roles?.map((r) => r.name) ?? []
}

function getUserFeatures(
  user: { features?: { feature: string }[] },
): string[] {
  return user.features?.map((f) => f.feature) ?? []
}

export function getAccessiblePanels(
  user: { roles?: { name: string }[]; features?: { feature: string }[] },
): PanelDef[] {
  const roleNames = getUserRoleNames(user)
  const featureNames = getUserFeatures(user)

  return PANEL_DEFINITIONS.filter((panel) => {
    if (panel.requiredRole && panel.requiredRole.length > 0) {
      if (panel.requiredRole.some((r) => roleNames.includes(r))) return true
    }
    if (panel.requiredFeature && panel.requiredFeature.length > 0) {
      if (panel.requiredFeature.some((f) => featureNames.includes(f))) return true
    }
    return false
  })
}

export function getDefaultPanel(
  user: { roles?: { name: string }[]; features?: { feature: string }[] },
): string {
  const roleNames = getUserRoleNames(user)
  const featureNames = getUserFeatures(user)

  if (roleNames.some((r) => ["Manager", "Admin", "OrgHead"].includes(r))) {
    return "/admin"
  }
  if (roleNames.includes("UnitHead")) {
    return "/unit-head"
  }
  if (featureNames.includes("canManageBudget")) {
    return "/finance"
  }
  if (roleNames.includes("Employee")) {
    return "/requests"
  }
  if (roleNames.includes("Ordinary")) {
    return "/ordinary"
  }
  if (featureNames.includes("canRespondToTender")) {
    return "/vendor"
  }

  return "/admin"
}

export function getPanelForRole(
  roleName: string,
  features: string[] = [],
): string | null {
  for (const panel of PANEL_DEFINITIONS) {
    if (panel.requiredRole?.includes(roleName)) return panel.path
    if (panel.requiredFeature?.some((f) => features.includes(f))) return panel.path
  }
  return null
}
