import { type ActFn, ObjectId } from "lesan";
import { user } from "../../../mod.ts";

export const removeUserFn: ActFn = async (body) => {
  const {
    set: { _id, hardCascade },
    get,
  } = body.details;

  return await user.deleteOne({
    filter: { _id: new ObjectId(_id as string) },
    hardCascade: hardCascade || false,
  });
};
