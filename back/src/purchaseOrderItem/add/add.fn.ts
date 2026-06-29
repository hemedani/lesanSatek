import { type ActFn, ObjectId } from "lesan";
import { purchaseOrderItem, purchasingRequest, coreApp } from "../../../mod.ts";
import type { MyContext } from "@lib";

export const addFn: ActFn = async (body) => {
  const { set, get } = body.details;
  const { user }: MyContext = coreApp.contextFns.getContextModel() as MyContext;

  const { activeRoleId, purchasingRequestId, assignedFromId, assignedById, ...rest } = set;

  const activeRole = (user.roles || []).find((r: { roleId: string }) => r.roleId === activeRoleId);

  const relations: Record<string, unknown> = {};

  relations.purchasingRequest = {
    _ids: new ObjectId(purchasingRequestId as string),
    relatedRelations: {
      purchaseOrderItems: true,
    },
  };

  if (assignedFromId) {
    relations.assignedFrom = {
      _ids: new ObjectId(assignedFromId as string),
      relatedRelations: { purchaseOrderItems: true },
    };
  }

  if (assignedById) {
    relations.assignedBy = {
      _ids: new ObjectId(assignedById as string),
      relatedRelations: {},
    };
  }

  const result = await purchaseOrderItem.insertOne({
    doc: rest,
    relations,
    projection: get,
  });

  // Push item_assigned history on the PR
  if (result && purchasingRequestId) {
    await purchasingRequest.findOneAndUpdate({
      filter: { _id: new ObjectId(purchasingRequestId as string) },
      update: {
        $push: {
          history: {
            action: "item_assigned",
            performed: {
              by: (assignedById as string) || user._id.toString(),
              name: `${user.first_name} ${user.last_name}`,
              at: new Date(),
              role: activeRole ? {
                id: activeRole.roleId,
                name: activeRole.name,
                scopeType: activeRole.scopeType,
                scopeId: activeRole.scopeId,
              } : { id: "", name: "" },
            },
            details: {
              wareModelId: rest.wareModelId,
              wareModelName: rest.wareModelName,
              quantity: rest.quantity,
              unitPrice: rest.unitPrice,
              status: rest.status,
            },
          },
        },
      },
      projection: { _id: 1 },
    });
  }

  return result;
};
