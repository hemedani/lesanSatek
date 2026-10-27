export interface FeatureFlag {
  feature: string
}

export interface FeatureRole {
  roleId: string
  name: string
  scopeType?: string
  scopeId?: string
}

export interface FeatureUnit {
  _id: string
  name?: string
  type?: string
  organization?: { _id?: string; name?: string }
  features?: FeatureFlag[]
}

export interface FeatureUser {
  features?: FeatureFlag[]
  roles?: FeatureRole[]
  units?: FeatureUnit[]
}

const featureNames = (features?: FeatureFlag[]): string[] =>
  features?.map((item) => item.feature).filter(Boolean) ?? []

export function getEffectiveFeatures(
  user: FeatureUser | null | undefined,
  activeRoleId?: string | null,
): string[] {
  if (!user) return []

  const result = new Set<string>(featureNames(user.features))
  const role = user.roles?.find((item) => item.roleId === activeRoleId)

  if (role?.scopeType === "unit" && role.scopeId) {
    const unit = user.units?.find((item) => item._id === role.scopeId)
    featureNames(unit?.features).forEach((feature) => result.add(feature))
  }

  if (role?.scopeType === "organization" && role.scopeId) {
    user.units
      ?.filter((unit) => unit.organization?._id === role.scopeId)
      .forEach((unit) => {
        featureNames(unit.features).forEach((feature) => result.add(feature))
      })
  }

  return [...result]
}

export function isPrivilegedRoleNames(roleNames: string[]): boolean {
  return roleNames.some((name) =>
    ["Manager", "Admin", "OrgHead"].includes(name),
  )
}
