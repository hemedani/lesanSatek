import { type ActFn, ObjectId } from "lesan";
import { purchaseOrderItem } from "../../../mod.ts";

export const updateFn: ActFn = async (body) => {
  const {
    set: { _id, ...fields },
    get,
  } = body.details;

  const updateObj: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined) {
      updateObj[key] = value;
    }
  }

  return await purchaseOrderItem.findOneAndUpdate({
    filter: { _id: new ObjectId(_id as string) },
    update: { $set: updateObj },
    projection: get,
  });
};
