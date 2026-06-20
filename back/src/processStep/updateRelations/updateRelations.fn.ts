import { type ActFn, ObjectId } from "lesan";
import { processStep } from "../../../mod.ts";

export const updateRelationsFn: ActFn = async (body) => {
  const {
    set: { _id },
    get,
  } = body.details;

  const modelId = new ObjectId(_id as string);

  return await processStep.findOne({
    filters: { _id: modelId },
    projection: get,
  });
};
