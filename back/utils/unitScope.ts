import { ObjectId } from "lesan";
import { type ActiveRole, isScopeBypass } from "./authzPolicy.ts";
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
): boolean => isScopeBypass(activeRole, user);

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

export const assertUnitInOrganization = async (
  unitId: unknown,
  organizationId: unknown,
  options: UnitScopeOptions = {},
): Promise<void> => {
  const normalizedUnitId = normalizeId(unitId);
  const objectId = toObjectId(normalizedUnitId);
  if (!normalizedUnitId || !objectId) {
    throwError("You cant do this");
    return;
  }

  const normalizedOrganizationId = normalizeId(organizationId);
  if (!normalizedOrganizationId) {
    throwError("You cant do this");
    return;
  }

  const unitDoc = await loadUnit(normalizedUnitId, options);
  if (!unitDoc) {
    throwError("You cant do this");
    return;
  }

  if (unitOrganizationId(unitDoc) !== normalizedOrganizationId) {
    throwError("You cant do this");
    return;
  }
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
