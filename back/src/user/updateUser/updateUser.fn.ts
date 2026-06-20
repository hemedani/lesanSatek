import { type ActFn, Infer, object, ObjectId } from "lesan";
import { user } from "../../../mod.ts";
import { user_pure } from "../../../models/user.ts";

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
    },
    get,
  } = body.details;

  const pureStruct = object(user_pure);
  const updateObj: Partial<Infer<typeof pureStruct>> = {
    updatedAt: new Date(),
    ...(first_name !== undefined && { first_name }),
    ...(last_name !== undefined && { last_name }),
    ...(gender !== undefined && { gender }),
    ...(birth_date !== undefined && { birth_date: new Date(birth_date as string) }),
    ...(mobile !== undefined && { mobile }),
    ...(roles !== undefined && { roles }),
    ...(email !== undefined && { email }),
    ...(password !== undefined && { password }),
    ...(is_verified !== undefined && { is_verified }),
    ...(position !== undefined && { position }),
    ...(isActive !== undefined && { isActive }),
  };

  return await user.findOneAndUpdate({
    filter: { _id: new ObjectId(_id as string) },
    update: {
      $set: updateObj,
    },
    projection: get,
  });
};