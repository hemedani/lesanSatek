import { type ActFn, ObjectId, type TInsertRelations } from "lesan";
import { user } from "../../../mod.ts";
import type { user_relations } from "@model";
import { hash } from "@da/bcrypt";
import { getAuth } from "@lib";
import { isManagerLike, isScopeBypass } from "../../../utils/authzPolicy.ts";
import {
  assertRolesAssignable,
  assignRolesToUser,
  type RoleInput,
} from "../shared/assignRoles.ts";

export const addUserFn: ActFn = async (body) => {
  const { set, get } = body.details;

  const {
    activeRoleId: _activeRoleId,
    avatar,
    organizations,
    units,
    state,
    city,
    password,
    roles,
    ...rest
  } = set;

  const { activeRole, user: actorUser } = await getAuth();
  const isGhost = isScopeBypass(activeRole, actorUser);

  const requestedRoles = (roles as RoleInput[] | undefined) ?? [];
  const suppliedOrganizations = (organizations as string[] | undefined) ?? [];
  const actorOrganizationId = !isManagerLike(activeRole) &&
      activeRole.scopeType === "organization" &&
      activeRole.scopeId
    ? String(activeRole.scopeId)
    : undefined;
  const organizationIds = suppliedOrganizations.length > 0
    ? suppliedOrganizations
    : actorOrganizationId
    ? [actorOrganizationId]
    : [];

  const targetScope = organizationIds.length > 0
    ? {
      scopeType: "organization" as const,
      scopeId: String(organizationIds[0]),
    }
    : null;

  const relations: TInsertRelations<typeof user_relations> = {};

  avatar &&
    (relations.avatar = {
      _ids: new ObjectId(avatar as string),
    });

  if (organizationIds.length > 0) {
    relations.organizations = {
      _ids: organizationIds.map((id: string) => new ObjectId(id)),
      relatedRelations: {
        users: true,
      },
    };
  }

  if (units && (units as string[]).length > 0) {
    relations.units = {
      _ids: (units as string[]).map((id: string) => new ObjectId(id)),
      relatedRelations: {
        members: true,
      },
    };
  }

  state &&
    (relations.state = {
      _ids: new ObjectId(state as string),
      relatedRelations: {
        users: true,
      },
    });

  city &&
    (relations.city = {
      _ids: new ObjectId(city as string),
      relatedRelations: {
        users: true,
      },
    });

  if (requestedRoles.length > 0) {
    await assertRolesAssignable({
      actor: activeRole,
      roles: requestedRoles,
      targetScope,
      isGhost,
      checkHead: true,
    });
  }

  const insertedRoles = requestedRoles.length > 0 ? [] : [{
    roleId: crypto.randomUUID(),
    name: "Ordinary" as const,
  }];

  const addedUser = await user.insertOne({
    doc: {
      ...rest,
      roles: insertedRoles,
      features: rest.features ?? [],
      password: password ? await hash(password as string) : undefined,
      birth_date: rest.birth_date
        ? new Date(rest.birth_date as string)
        : undefined,
    },
    relations,
    projection: { _id: 1 },
  });

  const addedUserId = String((addedUser as { _id: unknown })._id);

  return await assignRolesToUser({
    userId: addedUserId,
    actor: activeRole,
    addRoles: requestedRoles.length > 0 ? requestedRoles : undefined,
    get: get as Record<string, unknown>,
    isGhost,
  });
};
