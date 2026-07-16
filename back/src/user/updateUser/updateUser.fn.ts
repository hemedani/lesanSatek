import { type ActFn, Infer, object, ObjectId } from "lesan";
import { user } from "../../../mod.ts";
import { user_pure } from "../../../models/user.ts";
import { hash } from "@da/bcrypt";

export const updateUserFn: ActFn = async (body) => {
  const {
    set: {
      _id,
      first_name,
      last_name,
      gender,
      birth_date,
      mobile,
      roles,
      email,
      password,
      is_verified,
      position,
      isActive,
      features,
      allowWareTypeIds,
      allowWareClassIds,
      allowWareGroupIds,
      allowWareModelIds,
    },
    get,
  } = body.details;

  let resolvedRoles = roles;
  if (resolvedRoles) {
    resolvedRoles = resolvedRoles.map((r: Record<string, unknown>) => ({
      roleId: r.roleId || crypto.randomUUID(),
      name: r.name,
      ...(r.scopeType !== undefined && { scopeType: r.scopeType }),
      ...(r.scopeId !== undefined && { scopeId: r.scopeId }),
    }));
  }

  const pureStruct = object(user_pure);
  const updateObj: Partial<Infer<typeof pureStruct>> = {
    updatedAt: new Date(),
    ...(first_name !== undefined && { first_name }),
    ...(last_name !== undefined && { last_name }),
    ...(gender !== undefined && { gender }),
    ...(birth_date !== undefined && { birth_date: new Date(birth_date as string) }),
    ...(mobile !== undefined && { mobile }),
    ...(resolvedRoles !== undefined && { roles: resolvedRoles }),
    ...(email !== undefined && { email }),
    ...(password !== undefined && { password: await hash(password) }),
    ...(is_verified !== undefined && { is_verified }),
    ...(position !== undefined && { position }),
    ...(isActive !== undefined && { isActive }),
    ...(features !== undefined && { features }),
    ...(allowWareTypeIds !== undefined && { allowWareTypeIds }),
    ...(allowWareClassIds !== undefined && { allowWareClassIds }),
    ...(allowWareGroupIds !== undefined && { allowWareGroupIds }),
    ...(allowWareModelIds !== undefined && { allowWareModelIds }),
  };

  return await user.findOneAndUpdate({
    filter: { _id: new ObjectId(_id as string) },
    update: {
      $set: updateObj,
    },
    projection: get,
  });
};