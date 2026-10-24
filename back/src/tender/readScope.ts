import { type Document, ObjectId } from "lesan";
import type { ActiveRole } from "../../utils/authzPolicy.ts";
import { isScopeBypass } from "../../utils/authzPolicy.ts";
import type { ScopeUser } from "../../utils/readScope.ts";
import { throwError } from "../../utils/throwError.ts";

type UserWithId = ScopeUser & { _id?: unknown };

export type TenderRef = {
  purchasingRequest?: {
    organization?: { _id?: unknown } | null;
    requestingUnit?: { _id?: unknown } | null;
    requester?: { _id?: unknown } | null;
  } | null;
  assignedVendors?: { _id?: unknown }[] | null;
};

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

const userUnitObjectIds = (user: UserWithId | undefined): ObjectId[] => {
  const ids = new Map<string, ObjectId>();

  for (const unit of user?.units ?? []) {
    const objectId = toObjectId(unit?._id);
    if (objectId) ids.set(String(objectId), objectId);
  }

  return [...ids.values()];
};

const scopedObjectId = (
  activeRole: ActiveRole,
  scopeType: "organization" | "unit" | "store",
): ObjectId | null =>
  activeRole.scopeType === scopeType ? toObjectId(activeRole.scopeId) : null;

const selfOnlyMatch = (user: UserWithId | undefined): Document => {
  const requesterId = toObjectId(user?._id);
  const unitIds = userUnitObjectIds(user);

  const clauses: Document[] = [];

  if (unitIds.length > 0) {
    clauses.push({
      "purchasingRequest.requestingUnit._id": { $in: unitIds },
    });
  }

  if (requesterId) {
    clauses.push({ "purchasingRequest.requester._id": { $in: [requesterId] } });
  }

  if (clauses.length === 0) return emptyMatch();

  return clauses.length === 1 ? clauses[0] : { $or: clauses };
};

export const tenderReadMatch = (
  activeRole: ActiveRole,
  user: UserWithId | undefined,
): Document | null => {
  if (isScopeBypass(activeRole, user)) return null;

  switch (activeRole.name) {
    case "OrgHead": {
      const organizationId = scopedObjectId(activeRole, "organization");
      return organizationId
        ? {
          "purchasingRequest.organization._id": { $in: [organizationId] },
        }
        : emptyMatch();
    }
    case "UnitHead": {
      const unitId = scopedObjectId(activeRole, "unit");
      return unitId
        ? {
          "purchasingRequest.requestingUnit._id": { $in: [unitId] },
        }
        : emptyMatch();
    }
    case "StoreHead": {
      const storeId = scopedObjectId(activeRole, "store");
      return storeId
        ? { "assignedVendors._id": { $in: [storeId] } }
        : emptyMatch();
    }
    case "Employee":
    case "Ordinary":
      return selfOnlyMatch(user);
    default:
      return emptyMatch();
  }
};

export const tenderMatchesReadScope = (
  activeRole: ActiveRole,
  user: UserWithId | undefined,
  tenderDoc: TenderRef | null | undefined,
): boolean => {
  if (isScopeBypass(activeRole, user)) return true;
  if (!tenderDoc) return false;

  const organizationId = normalizeId(
    tenderDoc.purchasingRequest?.organization?._id,
  );
  const requestingUnitId = normalizeId(
    tenderDoc.purchasingRequest?.requestingUnit?._id,
  );
  const requesterId = normalizeId(
    tenderDoc.purchasingRequest?.requester?._id,
  );

  switch (activeRole.name) {
    case "OrgHead": {
      const scopeId = normalizeId(activeRole.scopeId);

      return activeRole.scopeType === "organization" &&
        scopeId !== null &&
        organizationId === scopeId;
    }
    case "UnitHead": {
      const scopeId = normalizeId(activeRole.scopeId);

      return activeRole.scopeType === "unit" &&
        scopeId !== null &&
        requestingUnitId === scopeId;
    }
    case "StoreHead": {
      const scopeId = normalizeId(activeRole.scopeId);

      if (activeRole.scopeType !== "store" || scopeId === null) return false;

      return (tenderDoc.assignedVendors ?? []).some((vendor) =>
        normalizeId(vendor?._id) === scopeId
      );
    }
    case "Employee":
    case "Ordinary": {
      const userId = normalizeId(user?._id);
      if (userId !== null && requesterId === userId) return true;

      const userUnitIds = new Set(
        (user?.units ?? [])
          .map((unit) => normalizeId(unit?._id))
          .filter((id): id is string => id !== null),
      );

      return requestingUnitId !== null && userUnitIds.has(requestingUnitId);
    }
    default:
      return false;
  }
};

export const assertCanReadTender = (
  activeRole: ActiveRole,
  user: UserWithId | undefined,
  tenderDoc: TenderRef | null | undefined,
): void => {
  if (tenderMatchesReadScope(activeRole, user, tenderDoc)) return;

  throwError("You cant do this");
};
