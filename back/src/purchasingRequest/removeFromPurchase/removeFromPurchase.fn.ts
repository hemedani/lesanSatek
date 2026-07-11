import { type ActFn, ObjectId } from "lesan";
import { purchasingRequest, purchaseOrderItem, coreApp } from "../../../mod.ts";
import type { MyContext } from "@lib";

export const removeFromPurchaseFn: ActFn = async (body) => {
  const { set, get } = body.details;
  const { user }: MyContext = coreApp.contextFns.getContextModel() as MyContext;
  const { activeRoleId, _id, purchaseOrderItemId } = set;

  const activeRole = (user.roles || []).find((r: { roleId: string }) => r.roleId === activeRoleId);
  const now = new Date();
  const prId = new ObjectId(_id as string);
  const itemId = new ObjectId(purchaseOrderItemId as string);

  const pr = await purchasingRequest.findOne({
    filters: { _id: prId },
    projection: { _id: 1, status: 1 },
  }) as Record<string, unknown>;

  if (!pr) {
    throw new Error("Purchasing request not found");
  }

  if (!["Pending", "InProgress", "Approved"].includes(pr.status as string)) {
    throw new Error("Cannot remove items from a completed, rejected, or draft request");
  }

  const item = await purchaseOrderItem.findOne({
    filters: { _id: itemId },
    projection: { _id: 1, status: 1, wareModel: { _id: 1, name: 1 } },
  }) as Record<string, unknown>;

  if (!item) {
    throw new Error("Purchase order item not found");
  }

  if ((item.status as string) === "cancelled") {
    throw new Error("Item is already cancelled");
  }

  const itemWareModel = item?.wareModel as Record<string, unknown> | undefined;

  await purchaseOrderItem.findOneAndUpdate({
    filter: { _id: itemId },
    update: { $set: { status: "cancelled", updatedAt: now } },
    projection: { _id: 1 },
  });

  await purchasingRequest.findOneAndUpdate({
    filter: { _id: prId },
    update: {
      $push: {
        history: {
          action: "item_removed",
          performed: {
            by: user._id.toString(),
            name: `${user.first_name} ${user.last_name}`,
            at: now,
            role: activeRole ? {
              id: activeRole.roleId,
              name: activeRole.name,
              scopeType: activeRole.scopeType,
              scopeId: activeRole.scopeId,
            } : { id: "", name: "" },
          },
          details: {
            purchaseOrderItemId,
            wareModelId: itemWareModel?._id?.toString(),
            wareModelName: itemWareModel?.name,
          },
        },
      },
    },
    projection: { _id: 1 },
  });

  return await purchasingRequest.findOne({
    filters: { _id: prId },
    projection: get,
  });
};
