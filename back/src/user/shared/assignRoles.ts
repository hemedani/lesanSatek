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

const targetScopeOfUser = async (
  userId: ObjectId,
): Promise<ScopeRef | null> => {
  const target = await user.findOne({
    filters: { _id: userId },
    projection: { organizations: { _id: 1 } },
  }) as RelationDocument;

  const organizations = target?.organizations;
  const firstOrganization = Array.isArray(organizations)
    ? organizations[0]
    : undefined;
  const organizationId = (firstOrganization as { _id?: unknown } | undefined)
    ?._id;

  return organizationId === null || organizationId === undefined
    ? null
    : { scopeType: "organization", scopeId: String(organizationId) };
};

const assertScopeConsistency = (role: RoleInput) => {
  const hasScopeType = role.scopeType !== undefined;
  const hasScopeId = role.scopeId !== undefined && role.scopeId !== "";

  if (hasScopeType !== hasScopeId) {
    throwError("You cant do this");
  }
};

const assertScopeResourceExists = async (
  role: RoleInput,
  actor: ActiveRole,
  targetScope: ScopeRef | null,
  isGhost: boolean,
) => {
  if (role.scopeType === "unit") {
    const unitId = objectIdOf(role.scopeId);

    const unitDoc = await unit.findOne({
      filters: { _id: unitId },
      projection: { organization: { _id: 1 } },
    }) as RelationDocument;

    if (!unitDoc) throwError("You cant do this");

    if (isGhost || isManagerLike(actor)) return;

    if (!targetScope || targetScope.scopeType !== "organization") {
      throwError("You cant do this");
      return;
    }

    if (relationId(unitDoc, "organization") !== String(targetScope.scopeId)) {
      throwError("You cant do this");
    }
  }

  if (role.scopeType === "organization") {
    const organizationId = objectIdOf(role.scopeId);

    const organizationDoc = await organization.findOne({
      filters: { _id: organizationId },
      projection: { _id: 1 },
    });

    if (!organizationDoc) throwError("You cant do this");
  }
};

const assertRoleAssignable = async (
  actor: ActiveRole,
  role: RoleInput,
  targetScope: ScopeRef | null,
  isGhost: boolean,
) => {
  assertScopeConsistency(role);

  if (!isGhost && !canAssignRole(actor, role, targetScope)) {
    throwError("You cant do this");
  }

  await assertScopeResourceExists(role, actor, targetScope, isGhost);
};

export const assertRolesAssignable = async (input: {
  actor: ActiveRole;
  roles: RoleInput[];
  targetScope: ScopeRef | null;
  isGhost?: boolean;
}): Promise<void> => {
  for (const role of input.roles) {
    await assertRoleAssignable(
      input.actor,
      role,
      input.targetScope,
      input.isGhost ?? false,
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
  await user.findOneAndUpdate({
    filter: { _id: userId },
    update: {
      $pull: {
        roles: {
          name: role.name,
          ...(role.scopeType !== undefined && { scopeType: role.scopeType }),
          ...(role.scopeId !== undefined && { scopeId: role.scopeId }),
        },
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

  const targetScope = await targetScopeOfUser(userId);
  const isGhost = input.isGhost ?? false;

  await assertRolesAssignable({
    actor: input.actor,
    roles: addRoles,
    targetScope,
    isGhost,
  });

  await assertRolesAssignable({
    actor: input.actor,
    roles: removeRoles,
    targetScope,
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
