import { type ActFn, ObjectId } from "lesan";
import { tender } from "../../../mod.ts";

export const closeFn: ActFn = async (body) => {
  const {
    set: { _id },
    get,
  } = body.details;

  return await tender.findOneAndUpdate({
    filter: { _id: new ObjectId(_id as string) },
    update: {
      $set: {
        status: "closed",
        updatedAt: new Date(),
      },
    },
    projection: get,
  });
};
