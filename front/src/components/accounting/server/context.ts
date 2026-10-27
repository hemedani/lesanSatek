import { cookies } from "next/headers"

import { getMe } from "@/app/actions/auth/getMe"
import { gets as getOrganizations } from "@/app/actions/organization/gets"
import { get as getUnit } from "@/app/actions/unit/get"
import {
  canCloseAccountingPeriod,
  canManageAccounting,
  canPostManualJournalEntry,
  canViewAccounting,
} from "@/lib/accounting-access"
import { getEffectiveFeatures, isPrivilegedRoleNames } from "@/lib/features"
import { getHighestRole } from "@/lib/roles"

export type AccountingMode = "admin" | "unit-head"

export type AccountingDenial =
  | "unauthenticated"
  | "no-feature"
  | "not-finance"
  | "no-organization"

export interface AccountingOrganization {
  _id: string
  name?: string
}

export interface AccountingContext {
  mode: AccountingMode
  activeRoleId: string
  activeRoleName: string
  roleNames: string[]
  features: string[]
  organizations: AccountingOrganization[]
  organizationId: string
  organizationName: string
  selectedOrganization?: AccountingOrganization
  isPrivileged: boolean
  isFinanceUnitHead: boolean
  allowed: boolean
  denial?: AccountingDenial
  canManage: boolean
  canPostManual: boolean
  canClosePeriod: boolean
  currency: "ریال"
}

interface UnitWithOrganization {
  _id: string
  name?: string
  type?: string
  organization?: { _id?: string; name?: string }
  features?: { feature: string }[]
}

interface AccountingUser {
  roles?: {
    roleId: string
    name: string
    scopeType?: string
    scopeId?: string
  }[]
  features?: { feature: string }[]
  organizations?: { _id: string; name?: string }[]
  units?: UnitWithOrganization[]
}

const organizationOptions = (value: unknown): AccountingOrganization[] => {
  if (!Array.isArray(value)) return []
  return value
    .filter(
      (item): item is AccountingOrganization =>
        !!item && typeof item === "object" && typeof item._id === "string",
    )
    .map((item) => ({ _id: item._id, name: item.name }))
}

const emptyContext = (
  mode: AccountingMode,
  denial: AccountingDenial,
): AccountingContext => ({
  mode,
  activeRoleId: "",
  activeRoleName: "",
  roleNames: [],
  features: [],
  organizations: [],
  organizationId: "",
  organizationName: "",
  isPrivileged: false,
  isFinanceUnitHead: false,
  allowed: false,
  denial,
  canManage: false,
  canPostManual: false,
  canClosePeriod: false,
  currency: "ریال",
})

export async function resolveAccountingContext(
  mode: AccountingMode,
  requestedOrganizationId?: string,
): Promise<AccountingContext> {
  const me = await getMe()

  if (!me.success || !me.body) {
    return emptyContext(mode, "unauthenticated")
  }

  const user = me.body as AccountingUser
  const cookieStore = await cookies()
  const cookieRoleId = cookieStore.get("activeRoleId")?.value || ""
  const fallbackRole = getHighestRole(user.roles ?? [])
  const activeRoleId = cookieRoleId || fallbackRole?.roleId || ""
  const activeRole = user.roles?.find((role) => role.roleId === activeRoleId)
  const roleNames = user.roles?.map((role) => role.name) ?? []
  const features = getEffectiveFeatures(user, activeRoleId)
  const isPrivileged = isPrivilegedRoleNames(roleNames)

  if (mode === "admin") {
    if (!isPrivileged) return emptyContext(mode, "no-feature")

    const organizationsResult = await getOrganizations(
      { page: 1, limit: 200, sortBy: "name", sortOrder: "asc" },
      { _id: 1, name: 1 },
    )

    let organizations = organizationsResult.success
      ? organizationOptions(organizationsResult.body)
      : []

    if (
      activeRole?.name === "OrgHead" &&
      activeRole.scopeType === "organization" &&
      activeRole.scopeId
    ) {
      organizations = organizations.filter(
        (organization) => organization._id === activeRole.scopeId,
      )
    }

    if (organizations.length === 0) {
      return { ...emptyContext(mode, "no-organization"), features, isPrivileged }
    }

    const requested = organizations.find(
      (organization) => organization._id === requestedOrganizationId,
    )
    const selectedOrganization = requested ?? organizations[0]
    const canView = isPrivileged || canViewAccounting(features)

    return {
      mode,
      activeRoleId,
      activeRoleName: activeRole?.name ?? "",
      roleNames,
      features,
      organizations,
      organizationId: selectedOrganization._id,
      organizationName: selectedOrganization.name ?? "",
      selectedOrganization,
      isPrivileged,
      isFinanceUnitHead: false,
      allowed: canView,
      denial: canView ? undefined : "no-feature",
      canManage: isPrivileged || canManageAccounting(features),
      canPostManual: isPrivileged || canPostManualJournalEntry(features),
      canClosePeriod: isPrivileged || canCloseAccountingPeriod(features),
      currency: "ریال",
    }
  }

  if (
    activeRole?.name !== "UnitHead" ||
    activeRole.scopeType !== "unit" ||
    !activeRole.scopeId
  ) {
    return { ...emptyContext(mode, "not-finance"), features, isPrivileged }
  }

  let unit = user.units?.find((item) => item._id === activeRole.scopeId)

  if (!unit || !unit.organization?._id) {
    const unitResult = await getUnit(
      { _id: activeRole.scopeId },
      {
        _id: 1,
        name: 1,
        type: 1,
        organization: { _id: 1, name: 1 },
        features: 1,
      },
    )
    const fetched =
      unitResult.success && unitResult.body?.[0]
        ? (unitResult.body[0] as UnitWithOrganization)
        : null
    unit = fetched ?? unit
  }

  const organizationId = unit?.organization?._id ?? ""
  const organizationName =
    unit?.organization?.name ??
    user.organizations?.find((item) => item._id === organizationId)?.name ??
    ""

  if (!organizationId) {
    return { ...emptyContext(mode, "no-organization"), features, isPrivileged }
  }

  const isFinanceUnitHead = unit?.type === "Finance"
  const hasView = canViewAccounting(features)
  const allowed = isFinanceUnitHead && hasView

  return {
    mode,
    activeRoleId,
    activeRoleName: activeRole.name,
    roleNames,
    features,
    organizations: [
      { _id: organizationId, name: organizationName || undefined },
    ],
    organizationId,
    organizationName,
    selectedOrganization: {
      _id: organizationId,
      name: organizationName || undefined,
    },
    isPrivileged,
    isFinanceUnitHead,
    allowed,
    denial: !isFinanceUnitHead
      ? "not-finance"
      : !hasView
      ? "no-feature"
      : undefined,
    canManage: isFinanceUnitHead && canManageAccounting(features),
    canPostManual: isFinanceUnitHead && canPostManualJournalEntry(features),
    canClosePeriod:
      isFinanceUnitHead && canCloseAccountingPeriod(features),
    currency: "ریال",
  }
}

export function readSearchParam(
  value: string | string[] | undefined,
): string {
  if (Array.isArray(value)) return value[0] ?? ""
  return value ?? ""
}

export function asPositiveInt(
  value: string | string[] | undefined,
  fallback = 1,
): number {
  const parsed = Number(readSearchParam(value))
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback
}
