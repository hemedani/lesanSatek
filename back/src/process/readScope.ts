import { type Document, ObjectId } from "lesan";
import type { ActiveRole } from "../../utils/authzPolicy.ts";
import { isManagerLike } from "../../utils/authzPolicy.ts";
import {
  organizationReadScope,
  type ScopeUser,
  unitReadScope,
} from "../../utils/readScope.ts";
import { throwError } from "../../utils/throwError.ts";

type ProcessRef = {
  organization?: { _id?: unknown } | null;
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

export const processReadMatch = async (
  activeRole: ActiveRole,
  user: ScopeUser | undefined,
): Promise<Document | null> => {
  if (user?.isGhost || isManagerLike(activeRole)) return null;

  const scope = await unitReadScope(activeRole, user);

  if (scope !== "all" && "organizationIds" in scope) {
    return {
      "organization._id": { $in: validObjectIds(scope.organizationIds) },
    };
  }

  const unitIds = scope === "all" ? [] : scope.unitIds;

  if (activeRole.name === "UnitHead") {
    const orgScope = await organizationReadScope(activeRole, user);
    const orgIds = orgScope !== "all" && "organizationIds" in orgScope
      ? orgScope.organizationIds
      : [];

    const clauses: Document[] = [
      { "unit._id": { $in: validObjectIds(unitIds) } },
    ];

    if (orgIds.length > 0) {
      clauses.push({
        "organization._id": { $in: validObjectIds(orgIds) },
        $or: [{ "unit._id": { $exists: false } }, { "unit._id": null }],
      });
    }

    return { $or: clauses };
  }

  return { "unit._id": { $in: validObjectIds(unitIds) } };
};

export const processMatchesReadScope = async (
  activeRole: ActiveRole,
  user: ScopeUser | undefined,
  processDoc: ProcessRef | null | undefined,
): Promise<boolean> => {
  if (user?.isGhost || isManagerLike(activeRole)) return true;
  if (!processDoc) return false;

  const processUnitId = normalizeId(processDoc.unit?._id);
  const processOrganizationId = normalizeId(processDoc.organization?._id);

  if (activeRole.name === "OrgHead") {
    const scopeId = normalizeId(activeRole.scopeId);

    return scopeId !== null && processOrganizationId === scopeId;
  }

  if (activeRole.name === "UnitHead") {
    const scopeId = normalizeId(activeRole.scopeId);

    if (scopeId !== null && processUnitId === scopeId) return true;

    const orgScope = await organizationReadScope(activeRole, user);
    const orgIds = orgScope !== "all" && "organizationIds" in orgScope
      ? orgScope.organizationIds
      : [];

    return processUnitId === null &&
      processOrganizationId !== null &&
      orgIds.some((id) => id === processOrganizationId);
  }

  const allowedUnitIds = (user?.units ?? [])
    .map((unit) => normalizeId(unit?._id))
    .filter((id): id is string => Boolean(id));

  return processUnitId !== null && allowedUnitIds.includes(processUnitId);
};

export const assertCanReadProcess = async (
  activeRole: ActiveRole,
  user: ScopeUser | undefined,
  processDoc: ProcessRef | null | undefined,
): Promise<void> => {
  if (await processMatchesReadScope(activeRole, user, processDoc)) return;

  throwError("You cant do this");
};
