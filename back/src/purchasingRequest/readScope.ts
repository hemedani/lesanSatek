import { type Document, ObjectId } from "lesan";
import type { ActiveRole } from "../../utils/authzPolicy.ts";
import { isScopeBypass } from "../../utils/authzPolicy.ts";
import type { ScopeUser } from "../../utils/readScope.ts";
import { throwError } from "../../utils/throwError.ts";

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

export type PurchasingRequestRef = {
  _id?: unknown;
  organization?: { _id?: unknown } | null;
  requestingUnit?: { _id?: unknown } | null;
  requester?: { _id?: unknown } | null;
  store?: { _id?: unknown } | null;
  wareModel?: { _id?: unknown; name?: unknown; enName?: unknown } | null;
  ware?: { _id?: unknown } | null;
  wareType?: { _id?: unknown } | null;
  wareClass?: { _id?: unknown } | null;
  wareGroup?: { _id?: unknown } | null;
  budgetLine?: { _id?: unknown } | null;
  process?: { _id?: unknown } | null;
  stuff?: { _id?: unknown } | null;
  status?: unknown;
  quantity?: unknown;
  title?: unknown;
  estimatedAmount?: unknown;
  currentStep?: unknown;
  selectionType?: unknown;
  selectedTenderOfferId?: unknown;
  stuffStatus?: unknown;
};

type PurchasingRequestLoader = (
  id: string,
) => Promise<PurchasingRequestRef | null>;

export type PurchasingRequestLoadOptions = {
  loadPurchasingRequest?: PurchasingRequestLoader;
};

export const purchasingRequestAccessProjection = {
  _id: 1,
  title: 1,
  status: 1,
  quantity: 1,
  estimatedAmount: 1,
  currentStep: 1,
  selectionType: 1,
  selectedTenderOfferId: 1,
  stuffStatus: 1,
  organization: { _id: 1 },
  requestingUnit: { _id: 1 },
  requester: { _id: 1 },
  store: { _id: 1 },
  wareModel: { _id: 1, name: 1, enName: 1 },
  wareType: { _id: 1 },
  wareClass: { _id: 1 },
  wareGroup: { _id: 1 },
  ware: { _id: 1 },
  budgetLine: { _id: 1 },
  process: { _id: 1 },
  stuff: { _id: 1 },
} as const;

type CoreAppModule = {
  purchasingRequest: {
    findOne: (options: Record<string, unknown>) => Promise<unknown>;
  };
};

export const CORE_APP_MODULE = "../../mod.ts";

const loadPurchasingRequestFromDb = async (
  id: string,
): Promise<PurchasingRequestRef | null> => {
  const objectId = objectIdOf(id);
  if (!objectId) return null;

  const { purchasingRequest } = await import(
    CORE_APP_MODULE
  ) as CoreAppModule;

  return await purchasingRequest.findOne({
    filters: { _id: objectId },
    projection: purchasingRequestAccessProjection,
  }) as PurchasingRequestRef | null;
};

export const purchasingRequestReadMatch = (
  activeRole: ActiveRole,
  user: UserWithId | undefined,
): Document | null => {
  if (isScopeBypass(activeRole, user)) return null;

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
      const unitIds = [
        ...new Set(
          (user?.units ?? [])
            .map((unit) => objectIdOf(unit?._id))
            .filter((id): id is ObjectId => id !== null)
            .map((id) => String(id)),
        ),
      ].map((id) => new ObjectId(id));
      const clauses: Document[] = [];

      if (unitIds.length > 0) {
        clauses.push({ "requestingUnit._id": { $in: unitIds } });
      }

      if (requesterId) {
        clauses.push({ "requester._id": { $in: [requesterId] } });
      }

      if (clauses.length === 0) return emptyMatch();

      return clauses.length === 1 ? clauses[0] : { $or: clauses };
    }
    default:
      return emptyMatch();
  }
};

type ProcessStepModule = {
  processStep: {
    aggregation: (options: {
      pipeline: Record<string, unknown>[];
    }) => { toArray: () => Promise<Record<string, unknown>[]> };
  };
};

/**
 * True when the unit is an assignee of any step of the given process — i.e. the
 * unit is expected to approve this request at some point.
 */
const unitApprovesProcess = async (
  unitId: string,
  processId: string,
): Promise<boolean> => {
  const processObjId = objectIdOf(processId);
  const normalizedUnitId = normalizeId(unitId);

  if (!processObjId || !normalizedUnitId) return false;

  try {
    const { processStep } = await import(CORE_APP_MODULE) as ProcessStepModule;
    const steps = await processStep
      .aggregation({
        pipeline: [
          {
            $match: {
              "process._id": processObjId,
              "assigneeGroups.unitIds": normalizedUnitId,
            },
          },
          { $limit: 1 },
          { $project: { _id: 1 } },
        ],
      })
      .toArray();

    return steps.length > 0;
  } catch {
    return false;
  }
};

/**
 * Read check for a single request.
 *
 * Extends the synchronous scope rules with one business rule that a plain
 * filter cannot express: a unit head must be able to open a request whose
 * current step is assigned to their unit, even when another unit raised it.
 * Without this the "در انتظار تأیید" card links to a 404.
 */
export const assertCanReadPurchasingRequestAsync = async (
  activeRole: ActiveRole,
  user: UserWithId | undefined,
  requestDoc: PurchasingRequestRef | null | undefined,
): Promise<void> => {
  try {
    assertCanReadPurchasingRequest(activeRole, user, requestDoc);
    return;
  } catch (error) {
    if (
      activeRole.name === "UnitHead" &&
      activeRole.scopeType === "unit" &&
      activeRole.scopeId
    ) {
      const processId = normalizeId(requestDoc?.process?._id);
      if (processId && (await unitApprovesProcess(activeRole.scopeId, processId))) {
        return;
      }
    }

    throw error;
  }
};

export const assertCanReadPurchasingRequest = (
  activeRole: ActiveRole,
  user: UserWithId | undefined,
  requestDoc: PurchasingRequestRef | null | undefined,
): void => {
  if (isScopeBypass(activeRole, user)) return;
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
      const requestingUnitId = normalizeId(requestDoc.requestingUnit?._id);
      const userUnitIds = new Set(
        (user?.units ?? [])
          .map((unit) => normalizeId(unit?._id))
          .filter((id): id is string => id !== null),
      );

      if (
        (userId !== null &&
          normalizeId(requestDoc.requester?._id) === userId) ||
        (requestingUnitId !== null && userUnitIds.has(requestingUnitId))
      ) {
        return;
      }
      break;
    }
  }

  throwError("You cant do this");
};

export const assertCanWritePurchasingRequest = (
  activeRole: ActiveRole,
  user: UserWithId | undefined,
  requestDoc: PurchasingRequestRef | null | undefined,
): void => {
  assertCanReadPurchasingRequest(activeRole, user, requestDoc);
};

export const loadPurchasingRequestForActor = async (
  activeRole: ActiveRole,
  user: UserWithId | undefined,
  id: unknown,
  options: PurchasingRequestLoadOptions = {},
): Promise<PurchasingRequestRef> => {
  const normalizedId = normalizeId(id);
  const objectId = objectIdOf(normalizedId);

  if (!normalizedId || !objectId) {
    throwError("You cant do this");
  }

  const loader = options.loadPurchasingRequest ??
    loadPurchasingRequestFromDb;
  const requestDoc = await loader(normalizedId as string);

  if (!requestDoc) {
    throwError("You cant do this");
  }

  assertCanReadPurchasingRequest(activeRole, user, requestDoc);

  return requestDoc as PurchasingRequestRef;
};
