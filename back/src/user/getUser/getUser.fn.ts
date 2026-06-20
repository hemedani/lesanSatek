import { type ActFn, ObjectId } from "lesan";
import { user } from "../../../mod.ts";
import { throwError } from "@lib";

export const getUserFn: ActFn = async (body) => {
  const {
    set: { _id },
    get,
  } = body.details;

  const foundedUser = await user
    .aggregation({
      pipeline: [{ $match: { _id: new ObjectId(_id as string) } }],
      projection: get,
    })
    .toArray();
  foundedUser.length < 1 && throwError("user not exist");
  return foundedUser[0];
};
