import { type ActFn, type Document, ObjectId } from "lesan";
import { purchaseOrderItem, purchasingRequest, coreApp } from "../../../mod.ts";
import type { MyContext } from "@lib";

export const updateFn: ActFn = async (body) => {
  const {
    set: { _id, ...fields },
    get,
  } = body.details;

  const { user }: MyContext = coreApp.contextFns.getContextModel() as MyContext;

  const itemId = new ObjectId(_id as string);
  const now = new Date();

  const existingItem = await purchaseOrderItem.findOne({
    filters: { _id: itemId },
    projection: { _id: 1, purchasingRequest: { _id: 1 }, wareModel: { _id: 1, name: 1 }, quantity: 1, unitPrice: 1, status: 1 },
  }) as Record<string, unknown>;

  const updateObj: Record<string, unknown> = {
    updatedAt: now,
  };

  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined) {
      updateObj[key] = value;
    }
  }

  const result = await purchaseOrderItem.findOneAndUpdate({
    filter: { _id: itemId },
    update: { $set: updateObj },
    projection: get,
  });

  const prRef = (existingItem?.purchasingRequest as Record<string, unknown>)?._id as string;
  if (prRef && Object.keys(fields).length > 0) {
    const activeRole = (user.roles || []).find((r: { roleId: string }) => r.roleId === body.details.set.activeRoleId);
    const wareModel = existingItem?.wareModel as Record<string, unknown> | undefined;
    await purchasingRequest.findOneAndUpdate({
      filter: { _id: new ObjectId(prRef) },
      update: {
        $push: {
          history: {
            action: "item_conditions_changed",
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
              purchaseOrderItemId: _id,
              wareModelId: wareModel?._id?.toString(),
              wareModelName: wareModel?.name,
              changes: fields,
            },
          },
        },
      },
      projection: { _id: 1 },
    });
  }

  return result;
};
