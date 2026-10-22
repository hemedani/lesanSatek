import { ObjectId } from "lesan";
import { organization, store, unit, user } from "../../../mod.ts";
import {
  type ActiveRole,
  canAssignRole,
  isManagerLike,
  type RoleName,
  type ScopeRef,
  type ScopeType,
} from "../../../utils/authzPolicy.ts";
import { throwError } from "@lib";
import type { ScopeResolver } from "../../../utils/grantAccess.ts";

export type RoleInput = {
  roleId?: string;
  name: RoleName;
  scopeType?: ScopeType;
  scopeId?: string;
};

export type AssignRolesInput = {
  userId: string;
  actor: ActiveRole;
  addRoles?: RoleInput[];
  removeRoles?: RoleInput[];
  get: Record<string, unknown>;
  isGhost?: boolean;
};

type RelationDocument = Record<string, unknown> | null | undefined;

const objectIdOf = (value: unknown): ObjectId => {
  if (value === null || value === undefined || value === "") {
    throw new Error("You cant do this");
  }

  try {
    return new ObjectId(String(value));
  } catch {
    throw new Error("You cant do this");
  }
};

const relationId = (doc: RelationDocument, field: string): string | null => {
  const relation = doc?.[field] as { _id?: unknown } | null | undefined;
  const id = relation?._id;

  return id === null || id === undefined ? null : String(id);
};

export type UserTargetContext = {
  organizationIds: Set<string>;
  unitIds: Set<string>;
  unitOrganizationIds: Map<string, string>;
  scope: ScopeRef | null;
};

const idsOf = (docs: unknown): Set<string> => {
  const ids = new Set<string>();

  if (!Array.isArray(docs)) return ids;

  for (const doc of docs) {
    const id = (doc as { _id?: unknown } | null)?._id;
    if (id === null || id === undefined) continue;
    ids.add(String(id));
  }

  return ids;
};

const unitOrganizationIdsOf = (docs: unknown): Map<string, string> => {
  const ids = new Map<string, string>();

  if (!Array.isArray(docs)) return ids;

  for (const doc of docs) {
    const unit = doc as {
      _id?: unknown;
      organization?: { _id?: unknown } | null;
    } | null;
    const unitId = unit?._id;
    const organizationId = unit?.organization?._id;

    if (
      unitId === null || unitId === undefined ||
      organizationId === null || organizationId === undefined
    ) {
      continue;
    }

    ids.set(String(unitId), String(organizationId));
  }

  return ids;
};

const targetContextOfUser = async (
  userId: ObjectId,
  actor: ActiveRole,
): Promise<UserTargetContext> => {
  const target = await user.findOne({
    filters: { _id: userId },
    projection: {
      organizations: { _id: 1 },
      units: { _id: 1, organization: { _id: 1 } },
    },
  }) as RelationDocument;

  if (!target) throwError("You cant do this");

  const organizationIds = idsOf(target?.organizations);
  const unitIds = idsOf(target?.units);
  const unitOrganizationIds = unitOrganizationIdsOf(target?.units);

  const actorOrganizationId = actor.scopeType === "organization" &&
      actor.scopeId
    ? String(actor.scopeId)
    : null;
  const preferredOrganizationId =
    actorOrganizationId && organizationIds.has(actorOrganizationId)
      ? actorOrganizationId
      : [...organizationIds][0] ?? null;

  return {
    organizationIds,
    unitIds,
    unitOrganizationIds,
    scope: preferredOrganizationId
      ? { scopeType: "organization", scopeId: preferredOrganizationId }
      : null,
  };
};

const assertActorCanAccessTarget = (
  actor: ActiveRole,
  target: UserTargetContext,
  isGhost: boolean,
) => {
  if (isGhost || isManagerLike(actor)) return;

  if (actor.name === "OrgHead") {
    if (
      actor.scopeType !== "organization" ||
      !actor.scopeId ||
      !target.organizationIds.has(String(actor.scopeId))
    ) {
      throwError("You cant do this");
    }
    return;
  }

  if (actor.name === "UnitHead") {
    if (
      actor.scopeType !== "unit" ||
      !actor.scopeId ||
      !target.unitIds.has(String(actor.scopeId))
    ) {
      throwError("You cant do this");
    }
    return;
  }

  throwError("You cant do this");
};

const targetObjectId = (userId: string | ObjectId): ObjectId =>
  userId instanceof ObjectId ? userId : new ObjectId(String(userId));

export const loadUserTargetContextForActor = async (
  userId: string | ObjectId,
  actor: ActiveRole,
  isGhost = false,
): Promise<UserTargetContext> => {
  const target = await targetContextOfUser(targetObjectId(userId), actor);
  assertActorCanAccessTarget(actor, target, isGhost);

  return target;
};

export const actorCanManageUser = async (
  userId: string | ObjectId,
  actor: ActiveRole,
  isGhost = false,
): Promise<boolean> => {
  try {
    await loadUserTargetContextForActor(userId, actor, isGhost);
    return true;
  } catch {
    return false;
  }
};

export const userTargetScope = (): ScopeResolver => async (body, user) => {
  const set = body?.details?.set ?? {};
  const authUser = user as
    | { roles?: ActiveRole[]; isGhost?: boolean }
    | undefined;
  const activeRole = (authUser?.roles ?? []).find((role) =>
    role.roleId === set.activeRoleId
  );
  const userId = set._id;

  if (
    !activeRole ||
    userId === null || userId === undefined || userId === ""
  ) {
    return null;
  }

  try {
    await loadUserTargetContextForActor(
      String(userId),
      activeRole,
      Boolean(authUser?.isGhost),
    );
  } catch {
    return null;
  }

  if (!activeRole.scopeType || !activeRole.scopeId) return null;

  return {
    scopeType: activeRole.scopeType,
    scopeId: String(activeRole.scopeId),
  };
};

const assertScopeConsistency = (role: RoleInput) => {
  const hasScopeType = role.scopeType !== undefined;
  const hasScopeId = role.scopeId !== undefined && role.scopeId !== "";

  if (hasScopeType !== hasScopeId) {
    throwError("You cant do this");
  }
};

const requiredScopeForRole: Partial<Record<RoleName, ScopeType>> = {
  OrgHead: "organization",
  UnitHead: "unit",
  StoreHead: "store",
};

const assertRoleScopePairing = (role: RoleInput) => {
  const requiredScope = requiredScopeForRole[role.name];

  if (requiredScope && role.scopeType !== requiredScope) {
    throwError("You cant do this");
  }
};

const assertScopeResourceExists = async (
  role: RoleInput,
  actor: ActiveRole,
  isGhost: boolean,
) => {
  if (!role.scopeType || !role.scopeId) return;

  if (role.scopeType === "organization") {
    const organizationDoc = await organization.findOne({
      filters: { _id: objectIdOf(role.scopeId) },
      projection: { _id: 1 },
    });

    if (!organizationDoc) throwError("You cant do this");
    return;
  }

  if (role.scopeType === "unit") {
    const unitDoc = await unit.findOne({
      filters: { _id: objectIdOf(role.scopeId) },
      projection: { _id: 1, organization: { _id: 1 } },
    }) as RelationDocument;

    if (!unitDoc) throwError("You cant do this");

    if (isGhost || isManagerLike(actor)) return;

    if (actor.name === "UnitHead") {
      if (
        actor.scopeType !== "unit" ||
        !actor.scopeId ||
        String(actor.scopeId) !== String(role.scopeId)
      ) {
        throwError("You cant do this");
      }
      return;
    }

    if (actor.name === "OrgHead") {
      const actorOrganizationId = actor.scopeType === "organization" &&
          actor.scopeId
        ? String(actor.scopeId)
        : null;

      if (
        !actorOrganizationId ||
        relationId(unitDoc, "organization") !== actorOrganizationId
      ) {
        throwError("You cant do this");
      }
      return;
    }

    throwError("You cant do this");
  }

  if (role.scopeType === "store") {
    const storeDoc = await store.findOne({
      filters: { _id: objectIdOf(role.scopeId) },
      projection: { _id: 1 },
    });

    if (!storeDoc) throwError("You cant do this");
  }
};

const assertHeadAvailable = async (
  userId: string | null,
  role: RoleInput,
  actor: ActiveRole,
  isGhost: boolean,
) => {
  if (isGhost || isManagerLike(actor)) return;
  if (role.name !== "OrgHead" && role.name !== "UnitHead") return;

  const targetModel = role.name === "OrgHead" ? organization : unit;

  const scopeDoc = await targetModel.findOne({
    filters: { _id: objectIdOf(role.scopeId) },
    projection: { head: { _id: 1 } },
  }) as RelationDocument;

  const currentHeadId = relationId(scopeDoc, "head");

  if (currentHeadId && currentHeadId !== userId) {
    throwError("You cant do this");
  }
};

const assertRoleAssignable = async (
  actor: ActiveRole,
  role: RoleInput,
  targetScope: ScopeRef | null,
  isGhost: boolean,
  headCheck?: { targetUserId: string | null },
) => {
  assertScopeConsistency(role);
  assertRoleScopePairing(role);

  if (!isGhost && !canAssignRole(actor, role, targetScope)) {
    throwError("You cant do this");
  }

  await assertScopeResourceExists(role, actor, isGhost);

  if (headCheck) {
    await assertHeadAvailable(headCheck.targetUserId, role, actor, isGhost);
  }
};

export const assertRolesAssignable = async (input: {
  actor: ActiveRole;
  roles: RoleInput[];
  targetScope: ScopeRef | null;
  isGhost?: boolean;
  checkHead?: boolean;
  targetUserId?: string | null;
}): Promise<void> => {
  for (const role of input.roles) {
    await assertRoleAssignable(
      input.actor,
      role,
      input.targetScope,
      input.isGhost ?? false,
      input.checkHead
        ? { targetUserId: input.targetUserId ?? null }
        : undefined,
    );
  }
};

const addRole = async (userId: ObjectId, role: RoleInput) => {
  if (role.scopeType === "unit" && role.scopeId) {
    const unitObjId = new ObjectId(role.scopeId);

    await user.addRelation({
      filters: { _id: userId },
      relations: {
        units: {
          _ids: [unitObjId],
          relatedRelations: {
            members: true,
          },
        },
      },
      projection: { _id: 1 },
    });

    const unitDoc = await unit.findOne({
      filters: { _id: unitObjId },
      projection: { organization: { _id: 1 } },
    }) as RelationDocument;

    const organizationId = relationId(unitDoc, "organization");

    if (organizationId) {
      await user.addRelation({
        filters: { _id: userId },
        relations: {
          organizations: {
            _ids: [new ObjectId(organizationId)],
            relatedRelations: {
              users: true,
            },
          },
        },
        projection: { _id: 1 },
      });
    }
  }

  if (role.scopeType === "organization" && role.scopeId) {
    await user.addRelation({
      filters: { _id: userId },
      relations: {
        organizations: {
          _ids: [new ObjectId(role.scopeId)],
          relatedRelations: {
            users: true,
          },
        },
      },
      projection: { _id: 1 },
    });
  }

  if (role.name === "UnitHead" && role.scopeId) {
    await unit.addRelation({
      filters: { _id: new ObjectId(role.scopeId) },
      relations: {
        head: {
          _ids: userId,
        },
      },
      projection: { _id: 1 },
      replace: true,
    });
  }

  if (role.name === "OrgHead" && role.scopeId) {
    await organization.addRelation({
      filters: { _id: new ObjectId(role.scopeId) },
      relations: {
        head: {
          _ids: userId,
        },
      },
      projection: { _id: 1 },
      replace: true,
    });
  }

  if (role.name === "StoreHead" && role.scopeId) {
    await store.addRelation({
      filters: { _id: new ObjectId(role.scopeId) },
      relations: {
        storeHead: {
          _ids: userId,
        },
      },
      projection: { _id: 1 },
      replace: true,
    });
  }

  const roleEntry: Record<string, unknown> = {
    roleId: role.roleId || crypto.randomUUID(),
    name: role.name,
  };
  if (role.scopeType) roleEntry.scopeType = role.scopeType;
  if (role.scopeId) roleEntry.scopeId = role.scopeId;

  await user.findOneAndUpdate({
    filter: {
      _id: userId,
      roles: {
        $not: {
          $elemMatch: {
            name: role.name,
            scopeType: role.scopeType,
            scopeId: role.scopeId,
          },
        },
      },
    },
    update: { $push: { roles: roleEntry } },
    projection: { _id: 1 },
  });
};

const removeRole = async (userId: ObjectId, role: RoleInput) => {
  const roleMatch: Record<string, unknown> = { name: role.name };

  roleMatch.scopeType = role.scopeType === undefined
    ? { $exists: false }
    : role.scopeType;
  roleMatch.scopeId = role.scopeId === undefined
    ? { $exists: false }
    : role.scopeId;

  await user.findOneAndUpdate({
    filter: { _id: userId },
    update: {
      $pull: {
        roles: roleMatch,
      },
    },
    projection: { _id: 1 },
  });

  if (role.scopeType === "unit" && role.scopeId) {
    await user.removeRelation({
      filters: { _id: userId },
      relations: {
        units: {
          _ids: [new ObjectId(role.scopeId)],
          relatedRelations: {
            members: true,
          },
        },
      },
      projection: { _id: 1 },
    });
  }

  if (role.scopeType === "organization" && role.scopeId) {
    await user.removeRelation({
      filters: { _id: userId },
      relations: {
        organizations: {
          _ids: [new ObjectId(role.scopeId)],
          relatedRelations: {
            users: true,
          },
        },
      },
      projection: { _id: 1 },
    });
  }

  if (role.name === "UnitHead" && role.scopeId) {
    const currentUnit = await unit.findOne({
      filters: { _id: new ObjectId(role.scopeId) },
      projection: { head: { _id: 1 } },
    }) as RelationDocument;

    if (relationId(currentUnit, "head") === userId.toString()) {
      await unit.removeRelation({
        filters: { _id: new ObjectId(role.scopeId) },
        relations: {
          head: {
            _ids: userId,
          },
        },
        projection: { _id: 1 },
      });
    }
  }

  if (role.name === "OrgHead" && role.scopeId) {
    const currentOrganization = await organization.findOne({
      filters: { _id: new ObjectId(role.scopeId) },
      projection: { head: { _id: 1 } },
    }) as RelationDocument;

    if (relationId(currentOrganization, "head") === userId.toString()) {
      await organization.removeRelation({
        filters: { _id: new ObjectId(role.scopeId) },
        relations: {
          head: {
            _ids: userId,
          },
        },
        projection: { _id: 1 },
      });
    }
  }

  if (role.name === "StoreHead" && role.scopeId) {
    const currentStore = await store.findOne({
      filters: { _id: new ObjectId(role.scopeId) },
      projection: { storeHead: { _id: 1 } },
    }) as RelationDocument;

    if (relationId(currentStore, "storeHead") === userId.toString()) {
      await store.removeRelation({
        filters: { _id: new ObjectId(role.scopeId) },
        relations: {
          storeHead: {
            _ids: userId,
          },
        },
        projection: { _id: 1 },
      });
    }
  }
};

export const assignRolesToUser = async (
  input: AssignRolesInput,
): Promise<unknown> => {
  const userId = objectIdOf(input.userId);

  const addRoles = input.addRoles ?? [];
  const removeRoles = input.removeRoles ?? [];

  const target = await targetContextOfUser(userId, input.actor);
  const isGhost = input.isGhost ?? false;

  assertActorCanAccessTarget(input.actor, target, isGhost);

  await assertRolesAssignable({
    actor: input.actor,
    roles: addRoles,
    targetScope: target.scope,
    isGhost,
    checkHead: true,
    targetUserId: userId.toString(),
  });

  await assertRolesAssignable({
    actor: input.actor,
    roles: removeRoles,
    targetScope: target.scope,
    isGhost,
  });

  for (const role of addRoles) {
    await addRole(userId, role);
  }

  for (const role of removeRoles) {
    await removeRole(userId, role);
  }

  return await user.findOne({
    filters: { _id: userId },
    projection: input.get as never,
  });
};
