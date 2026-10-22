import { type Document, ObjectId } from "lesan";
import { type ActiveRole, isManagerLike } from "../../utils/authzPolicy.ts";
import type { ScopeUser } from "../../utils/readScope.ts";

export type StockMovementUnitRef = {
  _id?: unknown;
  type?: string | null;
  organization?: { _id?: unknown } | null;
};

export type StockMovementScopeOptions = {
  loadOrganizationUnitIds?: (organizationId: string) => Promise<string[]>;
  loadUnit?: (unitId: string) => Promise<StockMovementUnitRef | null>;
};

type CoreAppModule = {
  unit: {
    find: (options: Record<string, unknown>) => {
      toArray: () => Promise<{ _id?: unknown }[]>;
    };
    findOne: (options: Record<string, unknown>) => Promise<unknown>;
  };
};

const CORE_APP_MODULE = "../../mod.ts";

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

const emptyMatch = (): Document => ({ _id: { $in: [] } });

const unitIdsMatch = (ids: ObjectId[]): Document =>
  ids.length > 0 ? { "unit._id": { $in: ids } } : emptyMatch();

const userUnitObjectIds = (user: ScopeUser | undefined): ObjectId[] => {
  const ids = new Map<string, ObjectId>();

  for (const unit of user?.units ?? []) {
    const objectId = toObjectId(unit?._id);
    if (objectId) ids.set(String(objectId), objectId);
  }

  return [...ids.values()];
};

const loadOrganizationUnitIdsFromDb = async (
  organizationId: string,
): Promise<string[]> => {
  const objectId = toObjectId(organizationId);
  if (!objectId) return [];

  const { unit } = await import(CORE_APP_MODULE) as CoreAppModule;

  const rows = await unit.find({
    filters: { "organization._id": objectId },
    projection: { _id: 1 },
  }).toArray();

  return rows
    .map((row) => normalizeId(row._id))
    .filter((id): id is string => id !== null);
};

const loadUnitFromDb = async (
  unitId: string,
): Promise<StockMovementUnitRef | null> => {
  const objectId = toObjectId(unitId);
  if (!objectId) return null;

  const { unit } = await import(CORE_APP_MODULE) as CoreAppModule;

  return await unit.findOne({
    filters: { _id: objectId },
    projection: { _id: 1, type: 1, organization: { _id: 1 } },
  }) as StockMovementUnitRef | null;
};

const organizationUnitMatch = async (
  organizationId: string,
  options: StockMovementScopeOptions,
): Promise<Document> => {
  const loader = options.loadOrganizationUnitIds ??
    loadOrganizationUnitIdsFromDb;

  let unitIds: string[] = [];

  try {
    unitIds = await loader(organizationId);
  } catch {
    return emptyMatch();
  }

  const objectIds = unitIds
    .map((id) => toObjectId(id))
    .filter((id): id is ObjectId => id !== null);

  return unitIdsMatch(objectIds);
};

export const stockMovementReadMatch = async (
  activeRole: ActiveRole,
  user: ScopeUser | undefined,
  options: StockMovementScopeOptions = {},
): Promise<Document | null> => {
  if (user?.isGhost || isManagerLike(activeRole)) return null;

  switch (activeRole.name) {
    case "OrgHead": {
      if (activeRole.scopeType !== "organization") return emptyMatch();

      const organizationId = normalizeId(activeRole.scopeId);
      if (!organizationId || !toObjectId(organizationId)) return emptyMatch();

      return organizationUnitMatch(organizationId, options);
    }
    case "UnitHead": {
      if (activeRole.scopeType !== "unit") return emptyMatch();

      const unitId = normalizeId(activeRole.scopeId);
      if (!unitId || !toObjectId(unitId)) return emptyMatch();

      const loader = options.loadUnit ?? loadUnitFromDb;

      let unitDoc: StockMovementUnitRef | null = null;

      try {
        unitDoc = await loader(unitId);
      } catch {
        return emptyMatch();
      }

      if (!unitDoc) return emptyMatch();

      if (unitDoc.type === "Warehouse") {
        const organizationId = normalizeId(unitDoc.organization?._id);
        if (!organizationId || !toObjectId(organizationId)) {
          return emptyMatch();
        }

        return organizationUnitMatch(organizationId, options);
      }

      return unitIdsMatch([new ObjectId(unitId)]);
    }
    case "Employee":
    case "Ordinary": {
      if (activeRole.scopeType === "unit") {
        const unitId = normalizeId(activeRole.scopeId);
        const objectId = toObjectId(unitId);

        return objectId ? unitIdsMatch([objectId]) : emptyMatch();
      }

      return unitIdsMatch(userUnitObjectIds(user));
    }
    case "StoreHead": {
      if (activeRole.scopeType !== "store") return emptyMatch();

      const storeId = toObjectId(activeRole.scopeId);

      return storeId ? { "store._id": storeId } : emptyMatch();
    }
    default:
      return emptyMatch();
  }
};
