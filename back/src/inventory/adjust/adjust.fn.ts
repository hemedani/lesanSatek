import { type ActFn, ObjectId } from "lesan";
import { inventory } from "../../../mod.ts";

export const adjustFn: ActFn = async (body) => {
  const {
    set: { _id, quantity, description },
    get,
  } = body.details;

  return await inventory.findOneAndUpdate({
    filter: { _id: new ObjectId(_id as string) },
    update: {
      $set: {
        quantity,
        updatedAt: new Date(),
      },
    },
    projection: get,
  });
};
