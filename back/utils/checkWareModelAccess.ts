import { ObjectId } from "lesan";
import type { ActiveRole } from "./authzPolicy.ts";
import { isScopeBypass } from "./authzPolicy.ts";
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

const holderAllows = (
  holder: AllowWareHolder,
  wareModel: WareModelRef,
): boolean =>
  !hasAllowLists(holder) || unitCanAccessWareModel(holder, wareModel);

export const assertWareModelAccess = async (
  user: WareModelAccessUser | undefined,
  activeRole: ActiveRole,
  wareModel: WareModelRef,
  options: WareModelAccessOptions = {},
): Promise<void> => {
  if (isScopeBypass(activeRole, user)) return;

  const userHolder = user ?? {};

  if (!holderAllows(userHolder, wareModel)) throwError("You cant do this");

  if (activeRole.name === "OrgHead") {
    if (activeRole.scopeType !== "organization" || !activeRole.scopeId) return;

    const loader = options.loadOrganizationUnits ?? loadOrganizationUnitsFromDb;
    let organizationUnits: AllowWareHolder[];

    try {
      organizationUnits = await loader(String(activeRole.scopeId));
    } catch {
      throwError("You cant do this");
      return;
    }

    if (
      organizationUnits.length > 0 &&
      !organizationUnits.some((holder) => holderAllows(holder, wareModel))
    ) {
      throwError("You cant do this");
    }

    return;
  }

  if (activeRole.name === "UnitHead" || activeRole.name === "Employee") {
    const scopedUnitId = activeRole.scopeType === "unit" && activeRole.scopeId
      ? String(activeRole.scopeId)
      : null;

    if (!scopedUnitId) return;

    const contextUnit = user?.units?.find((unit) =>
      normalizeId(unit._id) === scopedUnitId
    );

    let scopedUnit = contextUnit;

    if (!(contextUnit && hasAllowLists(contextUnit))) {
      const loader = options.loadUnit ?? loadUnitFromDb;
      let loadedUnit: AllowWareHolder | null;

      try {
        loadedUnit = await loader(scopedUnitId);
      } catch {
        throwError("You cant do this");
        return;
      }

      scopedUnit = loadedUnit ?? contextUnit;
    }

    if (
      scopedUnit && hasAllowLists(scopedUnit) &&
      !unitCanAccessWareModel(scopedUnit, wareModel)
    ) {
      throwError("You cant do this");
    }
  }
};
