import type { ActFn } from "lesan";
import { user } from "../../../mod.ts";
import { throwError } from "@lib";
import { hash } from "@da/bcrypt";

const defaultRole = () => [{ roleId: crypto.randomUUID(), name: "Ordinary" as const }];

export const tempUserFn: ActFn = async (body) => {
  const {
    set: {
      first_name,
      last_name,
      email,
      password,
      gender,
      birth_date,
      mobile,
    },
    get,
  } = body.details;

  const foundedUser = await user.find({ filters: {} }).limit(1).toArray();

  if (foundedUser.length > 0) {
    return throwError("Can not do this Action!!");
  }

  return await user.insertOne({
    doc: {
      first_name,
      last_name,
      email,
      password: await hash(password),
      gender,
      mobile,
      birth_date,
      isGhost: true,
      roles: defaultRole(),
      isActive: true,
      is_verified: false,
    },
    projection: get,
  });
};
