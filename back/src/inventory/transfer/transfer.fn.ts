import { type ActFn, type Document, ObjectId } from "lesan";
import { inventory, coreApp } from "../../../mod.ts";
import type { MyContext } from "@lib";
import { throwError } from "../../../utils/throwError.ts";

export const transferFn: ActFn = async (body) => {
  const {
    set: { fromUnitId, toUnitId, wareId, quantity, description, activeRoleId },
    get,
  } = body.details;

  const { user }: MyContext = coreApp.contextFns.getContextModel() as MyContext;

  const activeRole = (user.roles || []).find(
    (r: { roleId: string }) => r.roleId === activeRoleId,
  ) as { name: string; scopeType?: string; scopeId?: string } | undefined;

  if (!user.isGhost && activeRole && !["Manager", "Admin"].includes(activeRole.name)) {
    if (activeRole.scopeType === "unit" && activeRole.scopeId) {
      if (activeRole.scopeId.toString() !== fromUnitId.toString()) {
        throwError("You can only transfer inventory from your own unit");
        return;
      }
    } else {
      throwError("Your active role does not have an associated unit");
      return;
    }
  }

  const fromInv = await inventory.findOne({
    filters: {
      "unit._id": new ObjectId(fromUnitId as string),
      "ware._id": new ObjectId(wareId as string),
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
      "ware._id": new ObjectId(wareId as string),
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
