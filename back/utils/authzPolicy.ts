export type RoleName =
  | "Manager"
  | "Admin"
  | "OrgHead"
  | "UnitHead"
  | "StoreHead"
  | "Employee"
  | "Ordinary";

export type ScopeType = "organization" | "unit" | "store";

export type ScopeRef = { scopeType: ScopeType; scopeId: string };

export type ActiveRole = {
  roleId: string;
  name: RoleName;
  scopeType?: ScopeType;
  scopeId?: string;
};

const ALL_ROLES: RoleName[] = [
  "Manager",
  "Admin",
  "OrgHead",
  "UnitHead",
  "StoreHead",
  "Employee",
  "Ordinary",
];

const normalizeId = (value: unknown): string =>
  value === null || value === undefined ? "" : String(value);

export const isManagerLike = (role: ActiveRole): boolean =>
  role.name === "Manager" || role.name === "Admin";

export const scopeMatches = (
  role: ActiveRole,
  scope: ScopeRef | null,
): boolean => {
  if (!scope || !role.scopeType || !role.scopeId) return false;
  return role.scopeType === scope.scopeType &&
    normalizeId(role.scopeId) === normalizeId(scope.scopeId);
};

export const isRoleAllowed = (
  role: ActiveRole,
  allowed: RoleName[],
): boolean => allowed.includes(role.name);

export const assignableRoles = (actor: ActiveRole): RoleName[] => {
  switch (actor.name) {
    case "Manager":
      return [...ALL_ROLES];
    case "Admin":
      return ALL_ROLES.filter((role) => role !== "Manager");
    case "OrgHead":
      return ["OrgHead", "UnitHead", "Employee", "Ordinary"];
    case "UnitHead":
      return ["Employee", "Ordinary"];
    default:
      return [];
  }
};

const targetIsInActorOrganization = (
  actor: ActiveRole,
  targetScope: ScopeRef | null,
): boolean =>
  actor.scopeType === "organization" &&
  Boolean(actor.scopeId) &&
  targetScope !== null &&
  targetScope.scopeType === "organization" &&
  normalizeId(targetScope.scopeId) === normalizeId(actor.scopeId);

const scopedTargetIsAllowed = (
  actor: ActiveRole,
  target: { name: RoleName; scopeType?: ScopeType; scopeId?: string },
  targetScope: ScopeRef | null,
): boolean => {
  if (!target.scopeType || !target.scopeId) return false;
  if (target.scopeType === "store") return false;

  if (actor.name === "UnitHead") {
    return actor.scopeType === "unit" &&
      Boolean(actor.scopeId) &&
      target.scopeType === "unit" &&
      normalizeId(target.scopeId) === normalizeId(actor.scopeId);
  }

  if (actor.name === "OrgHead") {
    if (target.scopeType === "organization") {
      return actor.scopeType === "organization" &&
        Boolean(actor.scopeId) &&
        normalizeId(target.scopeId) === normalizeId(actor.scopeId);
    }
    if (target.scopeType === "unit") {
      return targetIsInActorOrganization(actor, targetScope);
    }
  }

  return false;
};

export const canAssignRole = (
  actor: ActiveRole,
  target: { name: RoleName; scopeType?: ScopeType; scopeId?: string },
  targetScope: ScopeRef | null,
): boolean => {
  if (!assignableRoles(actor).includes(target.name)) return false;
  if (isManagerLike(actor)) return true;

  if (target.name === "OrgHead") {
    if (target.scopeType === "organization") {
      return Boolean(target.scopeId) &&
        actor.scopeType === "organization" &&
        Boolean(actor.scopeId) &&
        normalizeId(target.scopeId) === normalizeId(actor.scopeId);
    }
    if (target.scopeType === "unit") {
      return Boolean(target.scopeId) &&
        targetIsInActorOrganization(actor, targetScope);
    }
    return false;
  }

  if (!target.scopeType && !target.scopeId) return true;

  return scopedTargetIsAllowed(actor, target, targetScope);
};
