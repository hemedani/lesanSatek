import { type ActFn, ObjectId, type TInsertRelations } from "lesan";
import { user } from "../../../mod.ts";
import type { user_relations } from "@model";
import { hash } from "@da/bcrypt";

export const addUserFn: ActFn = async (body) => {
  const { set, get } = body.details;

  const { activeRoleId, avatar, organization, password, roles, features, allowWareTypeIds, allowWareClassIds, allowWareGroupIds, allowWareModelIds, ...rest } = set;

  const rolesWithIds = (roles as { name: string; scopeType?: "organization" | "unit"; scopeId?: string; roleId?: string }[] | undefined)?.map((r) => ({
    ...r,
    roleId: r.roleId || crypto.randomUUID(),
  }));

  const relations: TInsertRelations<typeof user_relations> = {};

  avatar &&
    (relations.avatar = {
      _ids: new ObjectId(avatar as string),
    });

  organization &&
    (relations.organization = {
      _ids: [new ObjectId(organization as string)],
      relatedRelations: {
        users: true,
      },
    });

  const addedUser = await user.insertOne({
    doc: {
      ...rest,
      ...(rolesWithIds && { roles: rolesWithIds }),
      password: password ? await hash(password as string) : undefined,
      birth_date: rest.birth_date ? new Date(rest.birth_date as string) : undefined,
    },
    relations,
    projection: get,
  });

  return addedUser;
};
