import { ObjectId } from "lesan";
import { type ActiveRole, isManagerLike } from "./authzPolicy.ts";
import { getAuth } from "./grantAccess.ts";
import { throwError } from "./throwError.ts";
import { organization, unit } from "../mod.ts";

type Document = Record<string, unknown> | null | undefined;

type ScopeUser = {
  isGhost?: boolean;
  organizations?: { _id?: unknown }[];
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

const documentId = (doc: Document): string | null => {
  const id = doc?._id;

  return id === null || id === undefined ? null : String(id);
};

const setOf = (body: { details?: { set?: ScopeSet } } | undefined): ScopeSet =>
  body?.details?.set ?? {};

const isBypass = (user: ScopeUser | undefined, role: ActiveRole) =>
  Boolean(user?.isGhost) || isManagerLike(role);

const userUnitOrganization = (
  user: ScopeUser | undefined,
  scopeId: string | undefined,
): string | null => {
  if (!scopeId) return null;

  const scopedUnit = user?.units?.find((candidate) =>
    String(candidate._id) === scopeId
  );

  const organizationId = scopedUnit?.organization?._id;

  return organizationId === null || organizationId === undefined
    ? null
    : String(organizationId);
};

const actorOrganizationId = (
  activeRole: ActiveRole,
  user: ScopeUser | undefined,
): string | null => {
  if (
    activeRole.scopeType === "organization" && activeRole.scopeId
  ) {
    return String(activeRole.scopeId);
  }

  const fromScopedUnit = userUnitOrganization(user, activeRole.scopeId);
  if (fromScopedUnit) return fromScopedUnit;

  const firstOrganization = user?.organizations?.[0]?._id;

  return firstOrganization === null || firstOrganization === undefined
    ? null
    : String(firstOrganization);
};

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

export const assertUnitIdsInScope = (
  userOrField: ScopeUser | string | undefined,
  maybeField?: string,
) =>
async () => {
  const auth = await getAuth();
  const field = typeof userOrField === "string" ? userOrField : maybeField;

  if (!field) return throwError("You cant do this");

  const user = (typeof userOrField === "string" ? auth.user : userOrField) as
    | ScopeUser
    | undefined;

  if (isBypass(user, auth.activeRole)) return;

  const value = setOf(
    auth.body as { details?: { set?: ScopeSet } },
  )[field];

  if (value === null || value === undefined) return;

  const ids = Array.isArray(value) ? value : [value];
  if (ids.length === 0) return;

  const actorOrganization = actorOrganizationId(auth.activeRole, user);
  if (!actorOrganization) return throwError("You cant do this");

  if (field === "organizations") {
    for (const rawId of ids) {
      const organizationId = toObjectId(rawId);
      if (!organizationId) return throwError("You cant do this");

      const organizationDoc = await organization.findOne({
        filters: { _id: organizationId },
        projection: { _id: 1 },
      }) as Document;

      if (
        !organizationDoc ||
        documentId(organizationDoc) !== actorOrganization
      ) {
        throwError("You cant do this");
      }
    }

    return;
  }

  for (const rawId of ids) {
    const unitId = toObjectId(rawId);
    if (!unitId) return throwError("You cant do this");

    const unitDoc = await loadUnit(unitId);
    if (!unitDoc) return throwError("You cant do this");

    if (relationId(unitDoc, "organization") !== actorOrganization) {
      throwError("You cant do this");
    }
  }
};
