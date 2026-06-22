import { type ActFn, type Document, ObjectId } from "lesan";
import { inventory } from "../../../mod.ts";

export const transferFn: ActFn = async (body) => {
  const {
    set: { fromUnitId, toUnitId, wareModelId, quantity, description },
    get,
  } = body.details;

  const fromInv = await inventory.findOne({
    filters: {
      unit: new ObjectId(fromUnitId as string),
      wareModelId: wareModelId as string,
    },
    projection: { _id: 1, unit: 1, wareModelId: 1, quantity: 1 } as Document,
  }) as Document;

  if (!fromInv) {
    throw { error: "Source inventory not found" };
  }

  if ((fromInv.quantity as number) < (quantity as number)) {
    throw { error: "Insufficient quantity in source inventory" };
  }

  await inventory.findOneAndUpdate({
    filter: { _id: fromInv._id as ObjectId },
    update: {
      $inc: { quantity: -(quantity as number) },
      $set: { updatedAt: new Date() },
    },
    projection: { _id: 1, quantity: 1 },
  });

  const toInv = await inventory.findOne({
    filters: {
      unit: new ObjectId(toUnitId as string),
      wareModelId: wareModelId as string,
    },
    projection: { _id: 1, quantity: 1 } as Document,
  }) as Document;

  if (toInv) {
    await inventory.findOneAndUpdate({
      filter: { _id: toInv._id as ObjectId },
      update: {
        $inc: { quantity: quantity as number },
        $set: { updatedAt: new Date() },
      },
      projection: { _id: 1, quantity: 1 },
    });
  }

  return await inventory
    .aggregation({
      pipeline: [
        { $match: { unit: new ObjectId(fromUnitId as string), wareModelId: wareModelId as string } },
      ],
      projection: get,
    })
    .toArray();
};
