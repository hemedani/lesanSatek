import { type ActFn, ObjectId } from "lesan";
import { purchasingRequest, purchaseOrderItem, coreApp } from "../../../mod.ts";
import type { MyContext } from "@lib";

export const convertItemsFn: ActFn = async (body) => {
  const { set, get } = body.details;
  const { user }: MyContext = coreApp.contextFns.getContextModel() as MyContext;
  const { _id, items } = set;

  const now = new Date();
  const prId = new ObjectId(_id as string);

  const pr = await purchasingRequest.findOne({
    filters: { _id: prId },
    projection: { _id: 1, status: 1 },
  }) as Record<string, unknown>;

  if (!pr) {
    throw { error: "Purchasing request not found" };
  }

  const itemList = items as Array<{
    wareModelId: string;
    wareModelName: string;
    wareId?: string;
    wareName?: string;
    quantity: number;
    unitPrice?: number;
    assignedFromId?: string;
  }>;

  let itemCount = 0;

  for (const item of itemList) {
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

    if (item.assignedFromId) {
      poRelations.assignedFrom = {
        _ids: new ObjectId(item.assignedFromId),
        relatedRelations: {},
      };
    }

    await purchaseOrderItem.insertOne({
      doc: {
        wareModelId: item.wareModelId,
        wareModelName: item.wareModelName,
        wareId: item.wareId,
        wareName: item.wareName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        status: "assigned",
      },
      relations: poRelations,
      projection: { _id: 1 },
    });

    itemCount++;
  }

  // Push item_assigned history
  if (itemCount > 0) {
    await purchasingRequest.findOneAndUpdate({
      filter: { _id: prId },
      update: {
        $push: {
          history: {
            action: "item_assigned",
            performedBy: user._id.toString(),
            performedByName: `${user.first_name} ${user.last_name}`,
            performedAt: now,
            details: {
              itemCount,
              items: itemList.map((i) => ({
                wareModelId: i.wareModelId,
                wareModelName: i.wareModelName,
                quantity: i.quantity,
              })),
            },
          },
        },
      },
      projection: { _id: 1 },
    });
  }

  return await purchasingRequest.findOne({
    filters: { _id: prId },
    projection: get,
  });
};
