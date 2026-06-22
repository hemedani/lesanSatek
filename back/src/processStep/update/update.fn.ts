import { type ActFn, type Document, Infer, object, ObjectId } from "lesan";
import { processStep } from "../../../mod.ts";
import { processStep_pure } from "../../../models/processStep.ts";

export const updateFn: ActFn = async (body) => {
  const { set: { _id, name, description, stepType, order, required, groupsOperator, assigneeGroups }, get } =
    body.details;

  const pureStruct = object(processStep_pure);
  const updateObj: Partial<Infer<typeof pureStruct>> = {
    updatedAt: new Date(),
    ...(name !== undefined && { name }),
    ...(description !== undefined && { description }),
    ...(stepType !== undefined && { stepType }),
    ...(order !== undefined && { order }),
    ...(required !== undefined && { required }),
    ...(groupsOperator !== undefined && { groupsOperator }),
    ...(assigneeGroups !== undefined && { assigneeGroups }),
  };

  const newOrder = order as number | undefined;

  // Handle reordering if order is being changed
  if (newOrder !== undefined) {
    const currentStep = await processStep.findOne({
      filters: { _id: new ObjectId(_id as string) },
      projection: { order: 1, process: { _id: 1 } },
    }) as Record<string, unknown>;

    if (currentStep) {
      const oldOrder = currentStep.order as number;
      const processId = (currentStep.process as Record<string, unknown>)?._id as ObjectId;

      if (newOrder !== oldOrder && processId) {
        if (newOrder < oldOrder) {
          // Moving up: increment steps between newOrder and oldOrder-1
          const stepsToShift = await processStep.aggregation({
            pipeline: [
              { $match: { "process._id": processId, _id: { $ne: new ObjectId(_id as string) } } },
              { $match: { order: { $gte: newOrder, $lt: oldOrder } } },
              { $sort: { order: -1 } },
            ],
            projection: { _id: 1, order: 1 },
          }).toArray();

          for (const s of stepsToShift) {
            await processStep.findOneAndUpdate({
              filter: { _id: s._id as ObjectId },
              update: { $inc: { order: 1 }, $set: { updatedAt: new Date() } },
              projection: { _id: 1 },
            });
          }
        } else {
          // Moving down: decrement steps between oldOrder+1 and newOrder
          const stepsToShift = await processStep.aggregation({
            pipeline: [
              { $match: { "process._id": processId, _id: { $ne: new ObjectId(_id as string) } } },
              { $match: { order: { $gt: oldOrder, $lte: newOrder } } },
              { $sort: { order: 1 } },
            ],
            projection: { _id: 1, order: 1 },
          }).toArray();

          for (const s of stepsToShift) {
            await processStep.findOneAndUpdate({
              filter: { _id: s._id as ObjectId },
              update: { $inc: { order: -1 }, $set: { updatedAt: new Date() } },
              projection: { _id: 1 },
            });
          }
        }
      }
    }
  }

  return await processStep.findOneAndUpdate({
    filter: { _id: new ObjectId(_id as string) },
    update: { $set: updateObj },
    projection: get,
  });
};
