import { type ActFn, ObjectId } from "lesan";
import { purchasingRequest, purchaseOrderItem, stuff, ware, coreApp } from "../../../mod.ts";
import type { MyContext } from "@lib";

export const assignStoreFn: ActFn = async (body) => {
  const { set, get } = body.details;
  const { user }: MyContext = coreApp.contextFns.getContextModel() as MyContext;
  const { activeRoleId, _id, assignedFromId } = set;

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
    throw { error: "Purchasing request not found" };
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

  const poRelations: Record<string, unknown> = {
    purchasingRequest: {
      _ids: prId,
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
      wareModelId,
      wareModelName,
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

  return await purchasingRequest.findOne({
    filters: { _id: prId },
    projection: get,
  });
};
