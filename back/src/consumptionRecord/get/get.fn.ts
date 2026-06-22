import { type ActFn, ObjectId } from "lesan";
import { consumptionRecord } from "../../../mod.ts";

export const getFn: ActFn = async (body) => {
  const { set: { _id }, get } = body.details;

  return await consumptionRecord
    .aggregation({
      pipeline: [{ $match: { _id: new ObjectId(_id as string) } }],
      projection: get,
    })
    .toArray();
};
