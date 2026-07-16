import { type ActFn, ObjectId, type TInsertRelations } from "lesan";
import { user } from "../../../mod.ts";
import type { user_relations } from "@model";
import { hash } from "@da/bcrypt";

export const addUserFn: ActFn = async (body) => {
  const { set, get } = body.details;

  const {
    activeRoleId,
    avatar,
    organizations,
    units,
    state,
    city,
    password,
    roles,
    ...rest
  } = set;

  const rolesWithIds =
    (roles as {
      name: string;
      scopeType?: "organization" | "unit";
      scopeId?: string;
      roleId?: string;
    }[] | undefined)?.map((r) => ({
      ...r,
      roleId: r.roleId || crypto.randomUUID(),
    }));

  const relations: TInsertRelations<typeof user_relations> = {};

  avatar &&
    (relations.avatar = {
      _ids: new ObjectId(avatar as string),
    });

  const orgIds: string[] = [...(organizations as string[] || [])];
  const unitIds: string[] = [...(units as string[] || [])];

  if (rolesWithIds) {
    for (const role of rolesWithIds) {
      if (
        role.name === "UnitHead" && role.scopeType === "unit" && role.scopeId
      ) {
        if (!unitIds.some((id) => id === role.scopeId)) {
          unitIds.push(role.scopeId);
        }
      }
      if (
        role.name === "OrgHead" &&
        role.scopeType === "organization" && role.scopeId
      ) {
        if (!orgIds.some((id) => id === role.scopeId)) {
          orgIds.push(role.scopeId);
        }
      }
    }
  }

  if (orgIds.length > 0) {
    relations.organizations = {
      _ids: orgIds.map((id: string) => new ObjectId(id)),
      relatedRelations: {
        users: true,
      },
    };
  }

  if (unitIds.length > 0) {
    relations.units = {
      _ids: unitIds.map((id: string) => new ObjectId(id)),
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
      ...(rolesWithIds && { roles: rolesWithIds }),
      password: password ? await hash(password as string) : undefined,
      birth_date: rest.birth_date
        ? new Date(rest.birth_date as string)
        : undefined,
    },
    relations,
    projection: get,
  });

  return addedUser;
};
