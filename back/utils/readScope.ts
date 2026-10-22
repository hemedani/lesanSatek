import { ObjectId } from "lesan";
import {
  type ActiveRole,
  isManagerLike,
  isScopeBypass,
} from "./authzPolicy.ts";
import { throwError } from "./throwError.ts";

export type ReadScope =
  | "all"
  | { organizationIds: string[] }
  | { unitIds: string[] };

export type ScopeUser = {
  _id?: unknown;
  isGhost?: boolean;
  units?: {
    _id?: unknown;
    organization?: { _id?: unknown } | null;
  }[];
};

export type ScopeLoaderOptions = {
  loadDescendantUnitIds?: (unitId: string) => Promise<string[]>;
  loadUnitOrganizationId?: (unitId: string) => Promise<string | null>;
};

type Pipeline = Record<string, unknown>[];

const MAX_UNIT_DEPTH = 64;
const CORE_APP_MODULE = "../mod.ts";

const idOf = (value: unknown): string | null => {
  if (value === null || value === undefined || value === "") return null;

  return String(value);
};

const dedupe = (ids: string[]): string[] => [...new Set(ids)];

const sameId = (left: unknown, right: unknown): boolean => {
  const leftId = idOf(left);
  const rightId = idOf(right);

  return leftId !== null && rightId !== null && leftId === rightId;
};

const toObjectId = (id: string): ObjectId | null => {
  try {
    return new ObjectId(id);
  } catch {
    return null;
  }
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

const isBypass = (activeRole: ActiveRole, user: ScopeUser | undefined) =>
  isScopeBypass(activeRole, user);

const loadDescendantUnitIdsFromDb = async (
  unitId: string,
): Promise<string[]> => {
  const { unit } = await import(CORE_APP_MODULE) as {
    unit: {
      find: (options: Record<string, unknown>) => {
        toArray: () => Promise<{ _id?: unknown }[]>;
      };
    };
  };

  const descendants: string[] = [];
  const seen = new Set<string>([unitId]);
  let frontier: ObjectId[] = [];

  try {
    frontier = [new ObjectId(unitId)];
  } catch {
    return [];
  }

  for (let depth = 0; depth < MAX_UNIT_DEPTH; depth++) {
    if (frontier.length === 0) break;

    const children = await unit.find({
      filters: { "parentUnit._id": { $in: frontier } },
      projection: { _id: 1 },
    }).toArray();

    const next: ObjectId[] = [];

    for (const child of children) {
      const childId = idOf(child._id);
      if (!childId || seen.has(childId)) continue;

      seen.add(childId);
      descendants.push(childId);

      try {
        next.push(new ObjectId(childId));
      } catch {
        // Ignore malformed stored ids.
      }
    }

    frontier = next;
  }

  return descendants;
};

const loadUnitOrganizationIdFromDb = async (
  unitId: string,
): Promise<string | null> => {
  const { unit } = await import(CORE_APP_MODULE) as {
    unit: {
      findOne: (options: Record<string, unknown>) => Promise<unknown>;
    };
  };

  let objectId: ObjectId;

  try {
    objectId = new ObjectId(unitId);
  } catch {
    return null;
  }

  const unitDoc = await unit.findOne({
    filters: { _id: objectId },
    projection: { organization: { _id: 1 } },
  }) as { organization?: { _id?: unknown } | null } | null;

  return idOf(unitDoc?.organization?._id);
};

const unitIdsOf = (user: ScopeUser | undefined): string[] =>
  dedupe(
    (user?.units ?? [])
      .map((unit) => idOf(unit?._id))
      .filter((id): id is string => Boolean(id)),
  );

const organizationIdsOf = (user: ScopeUser | undefined): string[] =>
  dedupe(
    (user?.units ?? [])
      .map((unit) => idOf(unit?.organization?._id))
      .filter((id): id is string => Boolean(id)),
  );

export const unitReadScope = async (
  activeRole: ActiveRole,
  user: ScopeUser | undefined,
  options: ScopeLoaderOptions = {},
): Promise<ReadScope> => {
  if (isBypass(activeRole, user)) return "all";

  switch (activeRole.name) {
    case "OrgHead": {
      const organizationId = idOf(activeRole.scopeId);
      return organizationId
        ? { organizationIds: [organizationId] }
        : { organizationIds: [] };
    }
    case "UnitHead": {
      const unitId = idOf(activeRole.scopeId);
      if (!unitId || !toObjectId(unitId)) return { unitIds: [] };

      const loader = options.loadDescendantUnitIds ??
        loadDescendantUnitIdsFromDb;

      let descendants: string[] = [];

      try {
        descendants = await loader(unitId);
      } catch {
        return { unitIds: [] };
      }

      return { unitIds: dedupe([unitId, ...descendants]) };
    }
    default: {
      return { unitIds: unitIdsOf(user) };
    }
  }
};

export const organizationReadScope = async (
  activeRole: ActiveRole,
  user: ScopeUser | undefined,
  options: ScopeLoaderOptions = {},
): Promise<ReadScope> => {
  if (isBypass(activeRole, user)) return "all";

  if (activeRole.name === "OrgHead") {
    const organizationId = idOf(activeRole.scopeId);
    return organizationId
      ? { organizationIds: [organizationId] }
      : { organizationIds: [] };
  }

  if (activeRole.name === "UnitHead") {
    const unitId = idOf(activeRole.scopeId);

    if (!unitId || !toObjectId(unitId)) return { organizationIds: [] };

    const membership = (user?.units ?? []).find((unit) =>
      sameId(unit?._id, unitId)
    );
    const membershipOrganizationId = idOf(membership?.organization?._id);

    if (membershipOrganizationId) {
      return { organizationIds: [membershipOrganizationId] };
    }

    const loader = options.loadUnitOrganizationId ??
      loadUnitOrganizationIdFromDb;

    try {
      const organizationId = await loader(unitId);
      return organizationId
        ? { organizationIds: [organizationId] }
        : { organizationIds: [] };
    } catch {
      return { organizationIds: [] };
    }
  }

  return { organizationIds: organizationIdsOf(user) };
};

export const applyUnitReadScope = (
  pipeline: Pipeline,
  scope: ReadScope,
): void => {
  if (scope === "all") return;

  if ("organizationIds" in scope) {
    pipeline.push({
      $match: {
        "organization._id": { $in: validObjectIds(scope.organizationIds) },
      },
    });
    return;
  }

  pipeline.push({
    $match: { _id: { $in: validObjectIds(scope.unitIds) } },
  });
};

export const applyOrganizationReadScope = (
  pipeline: Pipeline,
  scope: ReadScope,
): void => {
  if (scope === "all") return;

  pipeline.push({
    $match: {
      _id: {
        $in: "organizationIds" in scope
          ? validObjectIds(scope.organizationIds)
          : [],
      },
    },
  });
};

export const assertCanReadUnit = async (
  activeRole: ActiveRole,
  user: ScopeUser | undefined,
  unitId: string,
  options: ScopeLoaderOptions = {},
): Promise<void> => {
  if (isBypass(activeRole, user)) return;

  const scope = await unitReadScope(activeRole, user, options);

  if (scope === "all") return;

  if ("unitIds" in scope) {
    if (scope.unitIds.some((candidate) => sameId(candidate, unitId))) return;
    throwError("You cant do this");
    return;
  }

  const loader = options.loadUnitOrganizationId ??
    loadUnitOrganizationIdFromDb;

  let organizationId: string | null = null;

  try {
    organizationId = await loader(unitId);
  } catch {
    throwError("You cant do this");
  }

  if (
    organizationId &&
    scope.organizationIds.some((candidate) => sameId(candidate, organizationId))
  ) {
    return;
  }

  throwError("You cant do this");
};

export const assertCanReadOrganization = async (
  activeRole: ActiveRole,
  user: ScopeUser | undefined,
  organizationId: string,
  options: ScopeLoaderOptions = {},
): Promise<void> => {
  if (isBypass(activeRole, user)) return;

  const scope = await organizationReadScope(activeRole, user, options);

  if (scope === "all") return;

  if (
    "organizationIds" in scope &&
    scope.organizationIds.some((candidate) => sameId(candidate, organizationId))
  ) {
    return;
  }

  throwError("You cant do this");
};

export const unitScope = unitReadScope;

export const organizationScope = organizationReadScope;

export const applyOrgUnitScope = (
  pipeline: Pipeline,
  scope: ReadScope,
  field?: string,
): void => {
  if (scope === "all") return;

  if ("organizationIds" in scope) {
    pipeline.push({
      $match: {
        [field ?? "organization._id"]: {
          $in: validObjectIds(scope.organizationIds),
        },
      },
    });
    return;
  }

  pipeline.push({
    $match: { _id: { $in: validObjectIds(scope.unitIds) } },
  });
};

export const isSelfOnlyRole = (activeRole: ActiveRole): boolean =>
  !isManagerLike(activeRole) &&
  activeRole.name !== "OrgHead" &&
  activeRole.name !== "UnitHead";

export const userReadFilter = (
  activeRole: ActiveRole,
  user: ScopeUser | undefined,
): Record<string, unknown> | null => {
  if (isBypass(activeRole, user)) return null;

  if (activeRole.name === "OrgHead") {
    const organizationId = toObjectId(idOf(activeRole.scopeId) ?? "");

    return organizationId
      ? { "organizations._id": organizationId }
      : { _id: { $in: [] } };
  }

  if (activeRole.name === "UnitHead") {
    const unitId = toObjectId(idOf(activeRole.scopeId) ?? "");

    return unitId ? { "units._id": unitId } : { _id: { $in: [] } };
  }

  const selfId = toObjectId(idOf(user?._id) ?? "");

  return selfId ? { _id: selfId } : { _id: { $in: [] } };
};
