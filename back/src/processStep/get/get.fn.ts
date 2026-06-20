import { type ActFn, ObjectId } from "lesan";
import { processStep } from "../../../mod.ts";
import { throwError } from "@lib";

export const getFn: ActFn = async (body) => {
  const {
    set: { _id },
    get,
  } = body.details;

  const foundedItem = await processStep
    .aggregation({
      pipeline: [{ $match: { _id: new ObjectId(_id as string) } }],
      projection: get,
    })
    .toArray();
  foundedItem.length < 1 && throwError("processStep not exist");
  return foundedItem[0];
};
