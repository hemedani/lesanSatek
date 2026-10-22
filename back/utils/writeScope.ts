import { ObjectId } from "lesan";
import { type ActiveRole, isManagerLike } from "./authzPolicy.ts";
import { getAuth } from "./grantAccess.ts";
import { throwError } from "./throwError.ts";
import { unit } from "../mod.ts";

type Document = Record<string, unknown> | null | undefined;

type ScopeUser = {
  isGhost?: boolean;
  units?: { _id?: unknown; organization?: { _id?: unknown } | null }[];
};

type ScopeSet = Record<string, unknown>;

const toObjectId = (value: unknown): ObjectId | null => {
  if (value === null || value === undefined || value === "") return null;

  try {
    return new ObjectId(String(value));
  } catch {
    return null;
  }
};

const relationId = (doc: Document, field: string): string | null => {
  const relation = doc?.[field] as { _id?: unknown } | null | undefined;
  const id = relation?._id;

  return id === null || id === undefined ? null : String(id);
};

const setOf = (body: { details?: { set?: ScopeSet } } | undefined): ScopeSet =>
  body?.details?.set ?? {};

const isBypass = (user: ScopeUser | undefined, role: ActiveRole) =>
  Boolean(user?.isGhost) || isManagerLike(role);

const loadUnit = async (id: ObjectId): Promise<Document> =>
  await unit.findOne({
    filters: { _id: id },
    projection: { organization: { _id: 1 } },
  }) as Document;

export const assertOrgFieldInScope = (field = "organizationId") => async () => {
  const { user, activeRole, body } = await getAuth();
  const scopeUser = user as ScopeUser | undefined;

  if (isBypass(scopeUser, activeRole)) return;

  const value = setOf(body as { details?: { set?: ScopeSet } })[field];
  if (value === null || value === undefined || value === "") return;

  if (
    activeRole.name === "OrgHead" &&
    activeRole.scopeType === "organization" &&
    activeRole.scopeId &&
    String(activeRole.scopeId) === String(value)
  ) {
    return;
  }

  throwError("You cant do this");
};

export const assertParentUnitInScope = (field = "parentUnitId") => async () => {
  const { user, activeRole, body } = await getAuth();
  const scopeUser = user as ScopeUser | undefined;

  if (isBypass(scopeUser, activeRole)) return;

  const value = setOf(body as { details?: { set?: ScopeSet } })[field];
  if (value === null || value === undefined || value === "") return;

  const parentUnitId = toObjectId(value);
  if (!parentUnitId) return throwError("You cant do this");

  const parentUnit = await loadUnit(parentUnitId);
  if (!parentUnit) return throwError("You cant do this");

  if (activeRole.name === "UnitHead") {
    if (
      activeRole.scopeType === "unit" &&
      activeRole.scopeId &&
      String(activeRole.scopeId) === String(parentUnitId)
    ) {
      return;
    }

    throwError("You cant do this");
  }

  if (activeRole.name === "OrgHead") {
    if (
      activeRole.scopeType === "organization" &&
      activeRole.scopeId &&
      relationId(parentUnit, "organization") === String(activeRole.scopeId)
    ) {
      return;
    }

    throwError("You cant do this");
  }

  throwError("You cant do this");
};

export const assertUnitFieldInScope = (field = "unitId") => async () => {
  const { user, activeRole, body } = await getAuth();
  const scopeUser = user as ScopeUser | undefined;

  if (isBypass(scopeUser, activeRole)) return;

  const value = setOf(body as { details?: { set?: ScopeSet } })[field];
  if (value === null || value === undefined || value === "") return;

  const unitId = toObjectId(value);
  if (!unitId) return throwError("You cant do this");

  const unitDoc = await loadUnit(unitId);
  if (!unitDoc) return throwError("You cant do this");

  if (activeRole.name === "UnitHead") {
    if (
      activeRole.scopeType === "unit" &&
      activeRole.scopeId &&
      String(activeRole.scopeId) === String(unitId)
    ) {
      return;
    }

    throwError("You cant do this");
  }

  if (activeRole.name === "OrgHead") {
    if (
      activeRole.scopeType === "organization" &&
      activeRole.scopeId &&
      relationId(unitDoc, "organization") === String(activeRole.scopeId)
    ) {
      return;
    }

    throwError("You cant do this");
  }

  if (activeRole.name === "Employee") {
    const belongsToUser = (scopeUser?.units ?? []).some((candidate) =>
      String(candidate._id) === String(unitId)
    );

    if (belongsToUser) return;

    throwError("You cant do this");
  }

  throwError("You cant do this");
};
