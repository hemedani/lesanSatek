import { type ActFn, ObjectId } from "lesan";
import { purchasingRequest, purchaseOrderItem, stuff, ware, coreApp } from "../../../mod.ts";
import type { MyContext } from "@lib";

export const assignStoreFn: ActFn = async (body) => {
  const { set, get } = body.details;
  const { user }: MyContext = coreApp.contextFns.getContextModel() as MyContext;
  const { activeRoleId, _id, assignedFromId, replaceExistingItemId } = set;

  const activeRole = (user.roles || []).find((r: { roleId: string }) => r.roleId === activeRoleId);

  const now = new Date();
  const prId = new ObjectId(_id as string);

  const pr = await purchasingRequest.findOne({
    filters: { _id: prId },
    projection: {
      _id: 1,
      status: 1,
      quantity: 1,
      wareModel: { _id: 1, name: 1, enName: 1 },
    },
  }) as Record<string, unknown>;

  if (!pr) {
    throw new Error("Purchasing request not found");
  }

  if (!["Pending", "InProgress"].includes(pr.status as string)) {
    throw new Error("Can only assign store items to an active purchasing request (Pending/InProgress)");
  }

  const wareModel = pr.wareModel as Record<string, unknown> | undefined;
  const wareModelId = wareModel?._id?.toString() || "";
  const wareModelName = (wareModel?.name as string) || "";
  const quantity = pr.quantity as number || 0;

  // Auto-lookup unitPrice from Stuff if a store is assigned
  let unitPrice: number | undefined;
  if (assignedFromId) {
    const stuffDoc = await stuff.aggregation({
      pipeline: [
        { $match: { "store._id": new ObjectId(assignedFromId as string), "wareModel._id": new ObjectId(wareModelId) } },
        { $limit: 1 },
      ],
      projection: { price: 1, hasAbsolutePrice: 1, pricePercentage: 1, ware: { _id: 1 } },
    }).toArray();

    if (stuffDoc.length > 0) {
      const s = stuffDoc[0] as Record<string, unknown>;
      if (s.hasAbsolutePrice) {
        unitPrice = s.price as number;
      } else if (s.pricePercentage) {
        const wareDoc = await ware.findOne({
          filters: { _id: new ObjectId((s.ware as Record<string, unknown>)?._id as string) },
          projection: { price: 1 },
        }) as Record<string, unknown>;
        if (wareDoc) {
          unitPrice = (wareDoc.price as number) * (1 + (s.pricePercentage as number) / 100);
        }
      }
    }
  }

  // If replacing an existing item, cancel it first
  if (replaceExistingItemId) {
    const existingItem = await purchaseOrderItem.findOne({
      filters: { _id: new ObjectId(replaceExistingItemId as string) },
      projection: { _id: 1, wareModel: { _id: 1, name: 1 }, status: 1 },
    }) as Record<string, unknown>;

    const existingWareModel = existingItem?.wareModel as Record<string, unknown> | undefined;

    if (existingItem && (existingItem.status as string) !== "cancelled") {
      await purchaseOrderItem.findOneAndUpdate({
        filter: { _id: new ObjectId(replaceExistingItemId as string) },
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
                role: activeRole
                  ? { id: activeRole.roleId, name: activeRole.name, scopeType: activeRole.scopeType, scopeId: activeRole.scopeId }
                  : { id: "", name: "" },
              },
              details: {
                purchaseOrderItemId: replaceExistingItemId,
                wareModelId: existingWareModel?._id?.toString(),
                wareModelName: existingWareModel?.name,
                reason: "Replaced with new store assignment",
              },
            },
          },
        },
        projection: { _id: 1 },
      });
    }
  }

  const poRelations: Record<string, unknown> = {
    purchasingRequest: {
      _ids: prId,
      relatedRelations: { purchaseOrderItems: true },
    },
    wareModel: {
      _ids: new ObjectId(wareModelId),
      relatedRelations: { purchaseOrderItems: true },
    },
    assignedBy: {
      _ids: user._id,
      relatedRelations: {},
    },
  };

  if (assignedFromId) {
    poRelations.assignedFrom = {
      _ids: new ObjectId(assignedFromId as string),
      relatedRelations: { purchaseOrderItems: true },
    };
  }

  await purchaseOrderItem.insertOne({
    doc: {
      quantity,
      unitPrice,
      totalPrice: unitPrice ? unitPrice * quantity : undefined,
      status: "assigned",
    },
    relations: poRelations,
    projection: { _id: 1 },
  });

  // Push item_assigned history
  await purchasingRequest.findOneAndUpdate({
    filter: { _id: prId },
    update: {
      $push: {
        history: {
          action: "item_assigned",
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
            wareModelId,
            wareModelName,
            quantity,
            unitPrice,
            assignedFromId: assignedFromId || null,
          },
        },
      },
    },
    projection: { _id: 1 },
  });

  // Auto-populate store on the PR
  if (assignedFromId) {
    await purchasingRequest.addRelation({
      filters: { _id: prId },
      relations: {
        store: {
          _ids: new ObjectId(assignedFromId as string),
          relatedRelations: { purchasingRequests: true },
        },
      },
      projection: { _id: 1 },
      replace: true,
    });
  }

  return await purchasingRequest.findOne({
    filters: { _id: prId },
    projection: get,
  });
};
