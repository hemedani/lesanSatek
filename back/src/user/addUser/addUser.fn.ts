import { type ActFn, ObjectId, type TInsertRelations } from "lesan";
import { user } from "../../../mod.ts";
import type { user_relations } from "@model";
import { hash } from "@da/bcrypt";
import { getAuth } from "@lib";
import { assignRolesToUser, type RoleInput } from "../shared/assignRoles.ts";

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

  const relations: TInsertRelations<typeof user_relations> = {};

  avatar &&
    (relations.avatar = {
      _ids: new ObjectId(avatar as string),
    });

  if (organizations && (organizations as string[]).length > 0) {
    relations.organizations = {
      _ids: (organizations as string[]).map((id: string) => new ObjectId(id)),
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

  const addedUser = await user.insertOne({
    doc: {
      ...rest,
      password: password ? await hash(password as string) : undefined,
      birth_date: rest.birth_date
        ? new Date(rest.birth_date as string)
        : undefined,
    },
    relations,
    projection: { _id: 1 },
  });

  const { activeRole } = await getAuth();
  const addedUserId = String((addedUser as { _id: unknown })._id);

  return await assignRolesToUser({
    userId: addedUserId,
    actor: activeRole,
    addRoles: roles as RoleInput[] | undefined,
    get: get as Record<string, unknown>,
  });
};
