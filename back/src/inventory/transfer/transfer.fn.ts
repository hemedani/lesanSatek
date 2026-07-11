import { type ActFn, type Document, ObjectId } from "lesan";
import { inventory } from "../../../mod.ts";

export const transferFn: ActFn = async (body) => {
  const {
    set: { fromUnitId, toUnitId, wareModelId, quantity, description },
    get,
  } = body.details;

  const fromInv = await inventory.findOne({
    filters: {
      "unit._id": new ObjectId(fromUnitId as string),
      "wareModel._id": new ObjectId(wareModelId as string),
    },
    projection: { _id: 1, unit: 1, quantity: 1 } as Document,
  }) as Document;

  if (!fromInv) {
    throw new Error("Source inventory not found");
  }

  if ((fromInv.quantity as number) < (quantity as number)) {
    throw new Error("Insufficient quantity in source inventory");
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
      "unit._id": new ObjectId(toUnitId as string),
      "wareModel._id": new ObjectId(wareModelId as string),
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

  return {
    fromUnit: await inventory.findOne({
      filters: { _id: fromInv._id as ObjectId },
      projection: get?.fromUnit || { _id: 1 },
    }),
    toUnit: toInv ? await inventory.findOne({
      filters: { _id: toInv._id as ObjectId },
      projection: get?.toUnit || { _id: 1 },
    }) : null,
    quantity,
  };
};
