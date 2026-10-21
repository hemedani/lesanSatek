import { ObjectId } from "lesan";
import type { ActiveRole } from "./authzPolicy.ts";
import { isManagerLike } from "./authzPolicy.ts";
import { throwError } from "./throwError.ts";

export type AllowWareHolder = {
  _id?: unknown;
  allowWareTypeIds?: unknown[];
  allowWareClassIds?: unknown[];
  allowWareGroupIds?: unknown[];
  allowWareModelIds?: unknown[];
  organization?: { _id?: unknown } | null;
};

export type WareModelRef = {
  _id?: unknown;
  wareType?: { _id?: unknown } | null;
  wareClass?: { _id?: unknown } | null;
  wareGroup?: { _id?: unknown } | null;
};

export type WareModelAccessUser = AllowWareHolder & {
  isGhost?: boolean;
  units?: AllowWareHolder[];
};

export type WareModelAccessOptions = {
  loadOrganizationUnits?: (
    organizationId: string,
  ) => Promise<AllowWareHolder[]>;
  loadUnit?: (unitId: string) => Promise<AllowWareHolder | null>;
};

type CoreAppModule = {
  unit: {
    find: (options: Record<string, unknown>) => {
      toArray: () => Promise<AllowWareHolder[]>;
    };
    findOne: (options: Record<string, unknown>) => Promise<unknown>;
  };
};

const CORE_APP_MODULE = "../mod.ts";

const normalizeId = (value: unknown): string | null => {
  if (value === null || value === undefined || value === "") return null;

  return String(value);
};

const idsOf = (values: unknown[] | undefined): string[] => {
  const ids: string[] = [];

  for (const value of values ?? []) {
    const id = normalizeId(value);
    if (id) ids.push(id);
  }

  return [...new Set(ids)];
};

const ALLOW_FIELDS = [
  "allowWareTypeIds",
  "allowWareClassIds",
  "allowWareGroupIds",
  "allowWareModelIds",
] as const;

const hasAllowLists = (holder: AllowWareHolder): boolean =>
  ALLOW_FIELDS.some((field) => idsOf(holder[field]).length > 0);

const mergeHolders = (holders: AllowWareHolder[]): AllowWareHolder => {
  const merged: AllowWareHolder = {};

  for (const field of ALLOW_FIELDS) {
    merged[field] = [
      ...new Set(holders.flatMap((holder) => idsOf(holder[field]))),
    ];
  }

  return merged;
};

const isAllowed = (
  allowIds: unknown[] | undefined,
  targetId: unknown,
): boolean => {
  const allowed = idsOf(allowIds);
  if (allowed.length === 0) return true;

  const target = normalizeId(targetId);

  return target !== null && allowed.includes(target);
};

export function unitCanAccessWareModel(
  holder: AllowWareHolder,
  wareModel: WareModelRef,
): boolean {
  return (
    isAllowed(holder.allowWareTypeIds, wareModel.wareType?._id) &&
    isAllowed(holder.allowWareClassIds, wareModel.wareClass?._id) &&
    isAllowed(holder.allowWareGroupIds, wareModel.wareGroup?._id) &&
    isAllowed(holder.allowWareModelIds, wareModel._id)
  );
}

export function userCanAccessWareModel(
  user: WareModelAccessUser,
  wareModel: WareModelRef,
): boolean {
  if (unitCanAccessWareModel(user, wareModel)) return true;
  if (user.units?.some((unit) => unitCanAccessWareModel(unit, wareModel))) {
    return true;
  }
  return false;
}

const loadUnitFromDb = async (
  unitId: string,
): Promise<AllowWareHolder | null> => {
  const { unit } = await import(CORE_APP_MODULE) as CoreAppModule;

  let unitObjectId: ObjectId;

  try {
    unitObjectId = new ObjectId(unitId);
  } catch {
    return null;
  }

  return await unit.findOne({
    filters: { _id: unitObjectId },
    projection: {
      _id: 1,
      allowWareTypeIds: 1,
      allowWareClassIds: 1,
      allowWareGroupIds: 1,
      allowWareModelIds: 1,
    },
  }) as AllowWareHolder | null;
};

const loadOrganizationUnitsFromDb = async (
  organizationId: string,
): Promise<AllowWareHolder[]> => {
  const { unit } = await import(CORE_APP_MODULE) as CoreAppModule;

  let organizationObjectId: ObjectId;

  try {
    organizationObjectId = new ObjectId(organizationId);
  } catch {
    return [];
  }

  return await unit.find({
    filters: { "organization._id": organizationObjectId },
    projection: {
      _id: 1,
      allowWareTypeIds: 1,
      allowWareClassIds: 1,
      allowWareGroupIds: 1,
      allowWareModelIds: 1,
    },
  }).toArray();
};

export const assertWareModelAccess = async (
  user: WareModelAccessUser | undefined,
  activeRole: ActiveRole,
  wareModel: WareModelRef,
  options: WareModelAccessOptions = {},
): Promise<void> => {
  if (user?.isGhost || isManagerLike(activeRole)) return;

  const holders: AllowWareHolder[] = [];

  if (activeRole.name === "OrgHead") {
    holders.push(user ?? {});

    if (activeRole.scopeType === "organization" && activeRole.scopeId) {
      const loader = options.loadOrganizationUnits ??
        loadOrganizationUnitsFromDb;

      try {
        holders.push(...await loader(String(activeRole.scopeId)));
      } catch {
        throwError("You cant do this");
      }
    }
  } else if (
    activeRole.name === "UnitHead" || activeRole.name === "Employee"
  ) {
    const scopedUnitId = normalizeId(activeRole.scopeId);
    const contextUnit = activeRole.scopeType === "unit" && scopedUnitId
      ? user?.units?.find((unit) => normalizeId(unit._id) === scopedUnitId)
      : undefined;

    let scopedUnit = contextUnit;

    if (scopedUnitId && !(contextUnit && hasAllowLists(contextUnit))) {
      try {
        const loader = options.loadUnit ?? loadUnitFromDb;
        scopedUnit = (await loader(scopedUnitId)) ?? contextUnit;
      } catch {
        scopedUnit = contextUnit;
      }
    }

    if (scopedUnit && hasAllowLists(scopedUnit)) {
      holders.push(scopedUnit);
    } else {
      holders.push(user ?? {});
    }
  } else {
    holders.push(user ?? {});
  }

  if (holders.every((holder) => !hasAllowLists(holder))) return;

  if (unitCanAccessWareModel(mergeHolders(holders), wareModel)) return;

  throwError("You cant do this");
};
