import { ObjectId } from "lesan";
import { type ActiveRole, isManagerLike } from "./authzPolicy.ts";
import type { ScopeUser } from "./readScope.ts";
import { throwError } from "./throwError.ts";

export type UnitScopeDocument = {
  _id?: unknown;
  organization?: { _id?: unknown } | null;
};

export type UnitScopeOptions = {
  loadUnit?: (unitId: string) => Promise<UnitScopeDocument | null>;
};

type CoreAppModule = {
  unit: {
    findOne: (options: Record<string, unknown>) => Promise<unknown>;
  };
};

const CORE_APP_MODULE = "../mod.ts";

const normalizeId = (value: unknown): string | null => {
  if (value === null || value === undefined || value === "") return null;

  return String(value);
};

const toObjectId = (value: unknown): ObjectId | null => {
  const normalized = normalizeId(value);
  if (!normalized) return null;

  try {
    return new ObjectId(normalized);
  } catch {
    return null;
  }
};

const loadUnitFromDb = async (
  unitId: string,
): Promise<UnitScopeDocument | null> => {
  const { unit } = await import(CORE_APP_MODULE) as CoreAppModule;
  const objectId = toObjectId(unitId);
  if (!objectId) return null;

  return await unit.findOne({
    filters: { _id: objectId },
    projection: { _id: 1, organization: { _id: 1 } },
  }) as UnitScopeDocument | null;
};

const isBypass = (
  user: ScopeUser | undefined,
  activeRole: ActiveRole,
): boolean => Boolean(user?.isGhost) || isManagerLike(activeRole);

const unitOrganizationId = (unitDoc: UnitScopeDocument | null): string | null =>
  normalizeId(unitDoc?.organization?._id);

const unitsOfUser = (user: ScopeUser | undefined): Set<string> =>
  new Set(
    (user?.units ?? [])
      .map((unit) => normalizeId(unit?._id))
      .filter((id): id is string => id !== null),
  );

const loadUnit = async (
  unitId: string,
  options: UnitScopeOptions,
): Promise<UnitScopeDocument | null> => {
  const loader = options.loadUnit ?? loadUnitFromDb;

  try {
    return await loader(unitId);
  } catch {
    return null;
  }
};

const actorOrganizationId = async (
  user: ScopeUser | undefined,
  activeRole: ActiveRole,
  options: UnitScopeOptions,
): Promise<string | null> => {
  if (activeRole.scopeType === "organization" && activeRole.scopeId) {
    return normalizeId(activeRole.scopeId);
  }

  if (activeRole.scopeType === "unit" && activeRole.scopeId) {
    const scopedUnitId = normalizeId(activeRole.scopeId);
    if (!scopedUnitId) return null;

    const membership = (user?.units ?? []).find((unit) =>
      normalizeId(unit?._id) === scopedUnitId
    );
    const membershipOrganizationId = normalizeId(
      membership?.organization?._id,
    );

    if (membershipOrganizationId) return membershipOrganizationId;

    const scopedUnit = await loadUnit(scopedUnitId, options);
    return unitOrganizationId(scopedUnit);
  }

  if (activeRole.name === "Employee" || activeRole.name === "Ordinary") {
    for (const unit of user?.units ?? []) {
      const organizationId = normalizeId(unit?.organization?._id);
      if (organizationId) return organizationId;
    }
  }

  return null;
};

export const assertUnitInActorScope = async (
  user: ScopeUser | undefined,
  activeRole: ActiveRole,
  unitId: unknown,
  options: UnitScopeOptions = {},
): Promise<void> => {
  if (isBypass(user, activeRole)) return;

  const normalizedUnitId = normalizeId(unitId);
  const objectId = toObjectId(normalizedUnitId);
  if (!normalizedUnitId || !objectId) {
    throwError("You cant do this");
    return;
  }

  const unitDoc = await loadUnit(normalizedUnitId, options);
  if (!unitDoc) {
    throwError("You cant do this");
    return;
  }

  switch (activeRole.name) {
    case "OrgHead": {
      const scopeId = normalizeId(activeRole.scopeId);
      const organizationId = unitOrganizationId(unitDoc);

      if (
        activeRole.scopeType === "organization" && scopeId &&
        organizationId === scopeId
      ) {
        return;
      }
      break;
    }
    case "UnitHead": {
      const scopeId = normalizeId(activeRole.scopeId);

      if (activeRole.scopeType === "unit" && scopeId === normalizedUnitId) {
        return;
      }
      break;
    }
    case "Employee":
    case "Ordinary":
      if (unitsOfUser(user).has(normalizedUnitId)) return;
      break;
  }

  throwError("You cant do this");
};

export const assertUnitsShareActorOrganization = async (
  user: ScopeUser | undefined,
  activeRole: ActiveRole,
  unitIds: unknown[],
  options: UnitScopeOptions = {},
): Promise<void> => {
  if (isBypass(user, activeRole)) return;
  if (unitIds.length === 0) return;

  const organizationId = await actorOrganizationId(user, activeRole, options);
  if (!organizationId) {
    throwError("You cant do this");
    return;
  }

  for (const unitId of unitIds) {
    const normalizedUnitId = normalizeId(unitId);
    const objectId = toObjectId(normalizedUnitId);
    if (!normalizedUnitId || !objectId) {
      throwError("You cant do this");
      return;
    }

    const unitDoc = await loadUnit(normalizedUnitId, options);
    if (!unitDoc) {
      throwError("You cant do this");
      return;
    }

    if (unitOrganizationId(unitDoc) !== organizationId) {
      throwError("You cant do this");
      return;
    }
  }
};

export const actorOrganizationIdForUnits = actorOrganizationId;
