import { type ActFn, ObjectId } from "lesan";
import { fiscalYear } from "../../../mod.ts";

export const closeFn: ActFn = async (body) => {
  const {
    set: { _id },
    get,
  } = body.details;

  return await fiscalYear.findOneAndUpdate({
    filter: { _id: new ObjectId(_id as string) },
    update: {
      $set: {
        status: "closed",
        isActive: false,
        updatedAt: new Date(),
      },
    },
    projection: get,
  });
};
