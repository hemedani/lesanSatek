import { type ActFn, type Document, ObjectId } from "lesan";
import { processStep } from "../../../mod.ts";

export const addFn: ActFn = async (body) => {
  const { set, get } = body.details;

  const { processId, ...rest } = set;

  const newOrder = rest.order as number;

  // Shift existing steps with order >= new order up by 1
  const conflictingSteps = await processStep.aggregation({
    pipeline: [
      { $match: { "process._id": new ObjectId(processId as string) } },
      { $match: { order: { $gte: newOrder } } },
      { $sort: { order: -1 } },
    ],
    projection: { _id: 1, order: 1 },
  }).toArray();

  for (const step of conflictingSteps) {
    await processStep.findOneAndUpdate({
      filter: { _id: step._id as ObjectId },
      update: { $inc: { order: 1 }, $set: { updatedAt: new Date() } },
      projection: { _id: 1 },
    });
  }

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
