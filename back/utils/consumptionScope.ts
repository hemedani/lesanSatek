import { type Document, ObjectId } from "lesan";
import { unit } from "../mod.ts";
import type { ActiveRole } from "./authzPolicy.ts";
import { isScopeBypass } from "./authzPolicy.ts";
import type { ScopeUser } from "./readScope.ts";

const emptyScope = (): Document => ({ "unit._id": { $in: [] } });

const normalizeId = (value: unknown): string | null => {
  if (value === null || value === undefined || value === "") return null;

  return String(value);
};

export const consumptionScopeAllowsUnit = (
  scope: Document,
  unitId: unknown,
): boolean => {
  const unitFilter = scope["unit._id"];

  if (unitFilter === undefined) return true;

  const candidate = normalizeId(unitId);
  if (candidate === null) return false;

  if (unitFilter instanceof ObjectId) {
    return candidate === String(unitFilter);
  }

  if (
    unitFilter && typeof unitFilter === "object" &&
    "$in" in unitFilter &&
    Array.isArray((unitFilter as { $in?: unknown[] }).$in)
  ) {
    return (unitFilter as { $in: unknown[] }).$in
      .some((value) => normalizeId(value) === candidate);
  }

  return false;
};

const unitsOfOrganization = async (
  organizationId: string,
): Promise<ObjectId[]> => {
  let organizationObjectId: ObjectId;

  try {
    organizationObjectId = new ObjectId(organizationId);
  } catch {
    return [];
  }

  const units = await unit.find({
    filters: { "organization._id": organizationObjectId },
    projection: { _id: 1 },
  }).toArray();

  return units
    .map((doc) => doc._id)
    .filter((id): id is ObjectId => id instanceof ObjectId);
};

const isWarehouseHead = async (activeRole: ActiveRole): Promise<boolean> => {
  if (activeRole.name !== "UnitHead") return false;
  if (activeRole.scopeType !== "unit" || !activeRole.scopeId) return false;

  let scopeObjectId: ObjectId;

  try {
    scopeObjectId = new ObjectId(String(activeRole.scopeId));
  } catch {
    return false;
  }

  const activeUnit = await unit.findOne({
    filters: { _id: scopeObjectId },
    projection: { type: 1 },
  }) as Document | null;

  return activeUnit?.type === "Warehouse";
};

export const consumptionScopeMatch = async (
  activeRole: ActiveRole,
  user: ScopeUser | undefined,
): Promise<Document> => {
  if (isScopeBypass(activeRole, user)) return {};

  if (activeRole.name === "Employee" || activeRole.name === "Ordinary") {
    if (activeRole.scopeType === "unit" && activeRole.scopeId) {
      return { "unit._id": new ObjectId(String(activeRole.scopeId)) };
    }

    return emptyScope();
  }

  if (activeRole.name === "UnitHead") {
    if (await isWarehouseHead(activeRole)) return {};

    if (activeRole.scopeType === "unit" && activeRole.scopeId) {
      return { "unit._id": new ObjectId(String(activeRole.scopeId)) };
    }

    return emptyScope();
  }

  if (activeRole.name === "OrgHead") {
    if (activeRole.scopeType === "organization" && activeRole.scopeId) {
      const organizationUnitIds = await unitsOfOrganization(
        String(activeRole.scopeId),
      );

      return { "unit._id": { $in: organizationUnitIds } };
    }

    return emptyScope();
  }

  return emptyScope();
};
