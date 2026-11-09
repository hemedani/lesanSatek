import type { ActFn } from "lesan";
import { purchasingRequest } from "../../../mod.ts";
import { getAuth } from "../../../utils/grantAccess.ts";
import { isScopeBypass } from "../../../utils/authzPolicy.ts";
import { throwError } from "../../../utils/throwError.ts";
import { buildPendingApprovalPipeline } from "../pendingPipeline.ts";

const normalizeId = (value: unknown): string | null => {
  if (value === null || value === undefined || value === "") return null;

  return String(value);
};

/**
 * Returns the purchasing requests the active role's unit(s) must act on now.
 *
 * The queue is scoped by **approval assignment** (the current step's
 * `assigneeGroups.unitIds`), never by `requestingUnit` — a unit head approves
 * requests raised by other units, so a requesting-unit scope would always come
 * back empty.
 */
export const getPendingByUnitFn: ActFn = async (body) => {
  const {
    set: { unitId: rawUnitId, page, limit, search },
    get,
  } = body.details;

  const { user, activeRole } = await getAuth();
  const bypass = isScopeBypass(activeRole, user);

  const requestedUnitId = normalizeId(rawUnitId);
  const roleScopeId = normalizeId(activeRole.scopeId);

  let unitIds: string[] | null = null;
  let organizationId: string | null = null;

  if (requestedUnitId) {
    // An explicit unit is only allowed when the actor governs that unit.
    if (!bypass && activeRole.name === "UnitHead" && requestedUnitId !== roleScopeId) {
      throwError("You cant do this");
    }

    if (!bypass && activeRole.name !== "UnitHead" && activeRole.name !== "OrgHead") {
      throwError("You cant do this");
    }

    unitIds = [requestedUnitId];
  } else if (bypass) {
    // Manager / Admin see every open request.
    unitIds = null;
  } else if (activeRole.name === "UnitHead") {
    if (!roleScopeId) {
      throwError("Unit ID is required");
      return [];
    }
    unitIds = [roleScopeId];
  } else if (activeRole.name === "OrgHead") {
    if (!roleScopeId) {
      throwError("You cant do this");
      return [];
    }
    organizationId = roleScopeId;
    unitIds = null;
  } else {
    // StoreHead / Employee / Ordinary have no approval queue.
    return [];
  }

  const calculatedSkip = (limit || 50) * ((page || 1) - 1);

  const pipeline = buildPendingApprovalPipeline({
    unitIds,
    organizationId,
    search,
  });

  pipeline.push(
    { $sort: { createdAt: -1 } },
    { $skip: calculatedSkip },
    { $limit: limit || 50 },
  );

  return await purchasingRequest
    .aggregation({
      pipeline,
      projection: get,
    })
    .toArray();
};
