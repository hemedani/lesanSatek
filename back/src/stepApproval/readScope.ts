import { ObjectId } from "lesan";
import { unit } from "../../mod.ts";
import type { ActiveRole } from "../../utils/authzPolicy.ts";
import { isManagerLike } from "../../utils/authzPolicy.ts";
import { type ScopeUser, unitReadScope } from "../../utils/readScope.ts";
import { throwError } from "../../utils/throwError.ts";

type StepApprovalRef = {
  unit?: { _id?: unknown } | null;
};

const normalizeId = (value: unknown): string | null => {
  if (value === null || value === undefined || value === "") return null;

  return String(value);
};

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

export const stepApprovalAllowedUnitIds = async (
  activeRole: ActiveRole,
  user: ScopeUser | undefined,
): Promise<ObjectId[] | null> => {
  if (user?.isGhost || isManagerLike(activeRole)) return null;

  const scope = await unitReadScope(activeRole, user);

  if (scope !== "all" && "unitIds" in scope) {
    return validObjectIds(scope.unitIds);
  }

  if (scope === "all") return null;

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

export const assertCanReadStepApproval = async (
  activeRole: ActiveRole,
  user: ScopeUser | undefined,
  approvalDoc: StepApprovalRef | null | undefined,
): Promise<void> => {
  const allowedUnitIds = await stepApprovalAllowedUnitIds(activeRole, user);

  if (allowedUnitIds === null) return;
  if (!approvalDoc) {
    throwError("You cant do this");
    return;
  }

  const unitId = normalizeId(approvalDoc.unit?._id);

  if (unitId && allowedUnitIds.some((id) => String(id) === unitId)) return;

  throwError("You cant do this");
};
