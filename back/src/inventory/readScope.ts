import { type Document, ObjectId } from "lesan";
import { unit } from "../../mod.ts";
import type { ActiveRole } from "../../utils/authzPolicy.ts";
import { isScopeBypass } from "../../utils/authzPolicy.ts";
import { type ScopeUser, unitReadScope } from "../../utils/readScope.ts";

const validObjectIds = (ids: string[]): ObjectId[] => {
  const objectIds: ObjectId[] = [];

  for (const id of ids) {
    try {
      objectIds.push(new ObjectId(id));
    } catch {
      // Invalid IDs can never match a stored ObjectId.
    }
  }

  return objectIds;
};

export const inventoryAllowedUnitIds = async (
  activeRole: ActiveRole,
  user: ScopeUser | undefined,
): Promise<ObjectId[] | null> => {
  if (isScopeBypass(activeRole, user)) return null;

  const scope = await unitReadScope(activeRole, user);

  if (scope === "all") return null;

  if ("unitIds" in scope) {
    return validObjectIds(scope.unitIds);
  }

  const organizationObjectIds = validObjectIds(scope.organizationIds);
  if (organizationObjectIds.length === 0) return [];

  const units = await unit.find({
    filters: { "organization._id": { $in: organizationObjectIds } },
    projection: { _id: 1 },
  }).toArray();

  return units
    .map((doc) => doc._id)
    .filter((id): id is ObjectId => id instanceof ObjectId);
};

export const unitsOfOrganization = async (
  organizationId: string,
): Promise<ObjectId[]> => {
  const organizationObjectIds = validObjectIds([organizationId]);
  if (organizationObjectIds.length === 0) return [];

  const units = await unit.find({
    filters: { "organization._id": { $in: organizationObjectIds } },
    projection: { _id: 1 },
  }).toArray();

  return units
    .map((doc) => doc._id)
    .filter((id): id is ObjectId => id instanceof ObjectId);
};

export const intersectObjectIds = (
  allowed: ObjectId[] | null,
  requested: ObjectId[],
): ObjectId[] | null => {
  if (allowed === null) return requested;

  const allowedSet = new Set(allowed.map((id) => String(id)));

  return requested.filter((id) => allowedSet.has(String(id)));
};

export const idMatch = (ids: ObjectId[]): Document => ({ $in: ids });
