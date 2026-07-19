import { type ActFn, ObjectId } from "lesan";
import { purchasingRequest, stuff, coreApp } from "../../../mod.ts";
import type { MyContext } from "@lib";
import { throwError } from "../../../utils/throwError.ts";
import { addStock } from "../../../utils/inventoryManager.ts";

const validStatuses = ["assigned", "ready_to_ship", "shipped", "delivered"];

export const updateStuffStatusFn: ActFn = async (body) => {
  const { set, get } = body.details;
  const { user }: MyContext = coreApp.contextFns.getContextModel() as MyContext;

  const { activeRoleId, _id, stuffStatus } = set;

  if (!validStatuses.includes(stuffStatus as string)) {
    throwError(
      `Invalid stuffStatus. Must be one of: ${validStatuses.join(", ")}`,
    );
  }

  const activeRole = (user.roles || []).find(
    (r: { roleId: string }) => r.roleId === activeRoleId,
  );

  const now = new Date();
  const prId = new ObjectId(_id as string);

  const pr = await purchasingRequest.findOne({
    filters: { _id: prId },
    projection: {
      _id: 1,
      status: 1,
      quantity: 1,
      store: { _id: 1 },
      stuff: { _id: 1 },
      requestingUnit: { _id: 1 },
      wareModel: { _id: 1 },
    },
  }) as Record<string, unknown>;

  if (!pr) {
    throwError("Purchasing request not found");
  }

  if (activeRole?.name === "StoreHead") {
    if (
      activeRole.scopeType !== "store" || !activeRole.scopeId
    ) {
      throwError("StoreHead role must have a store scope");
    }
    const prStoreId = (pr.store as Record<string, unknown>)?._id?.toString();
    if (prStoreId !== activeRole.scopeId) {
      throwError("You can only update stuff status for PRs assigned to your store");
    }
  }

  const updateData: Record<string, unknown> = {
    stuffStatus,
    updatedAt: now,
  };

  await purchasingRequest.findOneAndUpdate({
    filter: { _id: prId },
    update: {
      $set: updateData,
      $push: {
        history: {
          action: "stuff_status_updated",
          performed: {
            by: user._id.toString(),
            name: `${user.first_name} ${user.last_name}`,
            at: now,
            role: activeRole
              ? {
                id: activeRole.roleId,
                name: activeRole.name,
                scopeType: activeRole.scopeType,
                scopeId: activeRole.scopeId,
              }
              : { id: "", name: "" },
          },
          details: {
            stuffStatus,
          },
        },
      },
    },
    projection: { _id: 1 },
  });

  if (stuffStatus === "delivered") {
    const prStuff = pr.stuff as Record<string, unknown> | undefined;
    const prQuantity = pr.quantity as number || 0;
    const prWareModel = pr.wareModel as Record<string, unknown> | undefined;
    const prRequestingUnit = pr.requestingUnit as Record<string, unknown> | undefined;

    const prWareModelId = prWareModel?._id?.toString();
    const prRequestingUnitId = prRequestingUnit?._id?.toString();

    if (prStuff?._id && prQuantity > 0) {
      const stuffId = new ObjectId(prStuff._id.toString());
      const stuffDoc = await stuff.aggregation({
        pipeline: [
          { $match: { _id: stuffId } },
          { $limit: 1 },
        ],
        projection: { _id: 1, quantity: 1 },
      }).toArray();

      if (stuffDoc.length > 0) {
        const currentQty = (stuffDoc[0] as Record<string, unknown>).quantity as number || 0;
        const newQty = Math.max(0, currentQty - prQuantity);

        await stuff.findOneAndUpdate({
          filter: { _id: stuffId },
          update: { $set: { quantity: newQty, updatedAt: now } },
          projection: { _id: 1 },
        });
      }
    }

    if (prRequestingUnitId && prWareModelId && prQuantity > 0) {
      await addStock(
        prRequestingUnitId,
        prWareModelId,
        prQuantity,
        "goods_receipt",
        user._id.toString(),
        {
          referenceType: "purchasingRequest",
          referenceId: prId.toString(),
          description: `Store delivery for PR ${prId}`,
          storeId: (pr.store as Record<string, unknown>)?._id?.toString(),
        },
      );
    }
  }

  return await purchasingRequest.findOne({
    filters: { _id: prId },
    projection: get,
  });
};
