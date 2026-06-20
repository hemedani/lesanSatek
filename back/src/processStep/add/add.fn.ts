import { type ActFn, ObjectId } from "lesan";
import { processStep } from "../../../mod.ts";

export const addFn: ActFn = async (body) => {
  const { set, get } = body.details;

  const {
    processId,
    ...rest
  } = set;

  return await processStep.insertOne({
    doc: rest,
    relations: {
      process: {
        _ids: new ObjectId(processId as string),
        relatedRelations: {
          steps: true,
        },
      },
    },
    projection: get,
  });
};
