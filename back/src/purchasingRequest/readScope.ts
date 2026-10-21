import { type Document, ObjectId } from "lesan";
import type { ActiveRole } from "../../utils/authzPolicy.ts";
import { isManagerLike } from "../../utils/authzPolicy.ts";
import type { ScopeUser } from "../../utils/readScope.ts";
import { throwError } from "../../utils/throwError.ts";

type PurchasingRequestRef = {
  organization?: { _id?: unknown } | null;
  requestingUnit?: { _id?: unknown } | null;
  requester?: { _id?: unknown } | null;
  store?: { _id?: unknown } | null;
};

const normalizeId = (value: unknown): string | null => {
  if (value === null || value === undefined || value === "") return null;

  return String(value);
};

const objectIdOf = (value: unknown): ObjectId | null => {
  const normalized = normalizeId(value);

  if (!normalized) return null;

  try {
    return new ObjectId(normalized);
  } catch {
    return null;
  }
};

const emptyMatch = (): Document => ({ _id: { $in: [] } });

type UserWithId = ScopeUser & { _id?: unknown };

export const purchasingRequestReadMatch = (
  activeRole: ActiveRole,
  user: UserWithId | undefined,
): Document | null => {
  if (user?.isGhost || isManagerLike(activeRole)) return null;

  switch (activeRole.name) {
    case "OrgHead": {
      const organizationId = objectIdOf(activeRole.scopeId);
      return organizationId
        ? { "organization._id": { $in: [organizationId] } }
        : emptyMatch();
    }
    case "UnitHead": {
      const unitId = objectIdOf(activeRole.scopeId);
      return unitId
        ? { "requestingUnit._id": { $in: [unitId] } }
        : emptyMatch();
    }
    case "StoreHead": {
      const storeId = activeRole.scopeType === "store"
        ? objectIdOf(activeRole.scopeId)
        : null;
      return storeId ? { "store._id": { $in: [storeId] } } : emptyMatch();
    }
    case "Employee":
    case "Ordinary": {
      const requesterId = objectIdOf(user?._id);
      return requesterId
        ? { "requester._id": { $in: [requesterId] } }
        : emptyMatch();
    }
    default:
      return emptyMatch();
  }
};

export const assertCanReadPurchasingRequest = (
  activeRole: ActiveRole,
  user: UserWithId | undefined,
  requestDoc: PurchasingRequestRef | null | undefined,
): void => {
  if (user?.isGhost || isManagerLike(activeRole)) return;
  if (!requestDoc) {
    throwError("You cant do this");
    return;
  }

  const matches = (value: unknown): boolean => {
    const actual = normalizeId(value);
    const expected = normalizeId(activeRole.scopeId);

    return actual !== null && expected !== null && actual === expected;
  };

  switch (activeRole.name) {
    case "OrgHead":
      if (matches(requestDoc.organization?._id)) return;
      break;
    case "UnitHead":
      if (matches(requestDoc.requestingUnit?._id)) return;
      break;
    case "StoreHead":
      if (
        activeRole.scopeType === "store" && matches(requestDoc.store?._id)
      ) {
        return;
      }
      break;
    case "Employee":
    case "Ordinary": {
      const userId = normalizeId(user?._id);

      if (
        userId !== null && normalizeId(requestDoc.requester?._id) === userId
      ) {
        return;
      }
      break;
    }
  }

  throwError("You cant do this");
};
