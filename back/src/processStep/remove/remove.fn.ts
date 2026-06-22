import { type ActFn, type Document, ObjectId } from "lesan";
import { processStep } from "../../../mod.ts";

export const removeFn: ActFn = async (body) => {
  const { set: { _id, hardCascade }, get } = body.details;

  // Get the step to find its order and process
  const step = await processStep.findOne({
    filters: { _id: new ObjectId(_id as string) },
    projection: { order: 1, process: { _id: 1 } },
  }) as Record<string, unknown>;

  if (!step) {
    throw { error: "Step not found" };
  }

  const removedOrder = step.order as number;
  const processId = (step.process as Record<string, unknown>)?._id as ObjectId;

  // Remove the step
  const result = await processStep.deleteOne({
    filter: { _id: new ObjectId(_id as string) },
    hardCascade: hardCascade || false,
  });

  // Decrement order of all remaining steps with order > removed order
  if (processId) {
    const higherSteps = await processStep.aggregation({
      pipeline: [
        { $match: { "process._id": processId } },
        { $match: { order: { $gt: removedOrder } } },
        { $sort: { order: 1 } },
      ],
      projection: { _id: 1, order: 1 },
    }).toArray();

    for (const s of higherSteps) {
      await processStep.findOneAndUpdate({
        filter: { _id: s._id as ObjectId },
        update: { $inc: { order: -1 }, $set: { updatedAt: new Date() } },
        projection: { _id: 1 },
      });
    }
  }

  return result;
};
