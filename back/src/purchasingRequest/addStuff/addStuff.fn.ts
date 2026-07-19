import { type ActFn, ObjectId } from "lesan";
import { purchasingRequest, stuff, ware, coreApp } from "../../../mod.ts";
import type { MyContext } from "@lib";

export const addStuffFn: ActFn = async (body) => {
  const { set, get } = body.details;
  const { user }: MyContext = coreApp.contextFns.getContextModel() as MyContext;
  const { activeRoleId, _id, stuffId } = set;

  const activeRole = (user.roles || []).find((r: { roleId: string }) => r.roleId === activeRoleId);

  const now = new Date();
  const prId = new ObjectId(_id as string);

  const pr = await purchasingRequest.findOne({
    filters: { _id: prId },
    projection: {
      _id: 1,
      status: 1,
      quantity: 1,
      wareModel: { _id: 1, name: 1 },
    },
  }) as Record<string, unknown>;

  if (!pr) {
    throw new Error("Purchasing request not found");
  }

  if (!["Pending", "InProgress"].includes(pr.status as string)) {
    throw new Error("Can only add stuff to an active purchasing request (Pending/InProgress)");
  }

  const prWareModelId = (pr.wareModel as Record<string, unknown>)?._id?.toString();
  const quantity = pr.quantity as number || 0;

  const stuffDoc = await stuff.aggregation({
    pipeline: [
      { $match: { _id: new ObjectId(stuffId as string) } },
      { $limit: 1 },
    ],
    projection: {
      _id: 1,
      price: 1,
      hasAbsolutePrice: 1,
      pricePercentage: 1,
      ware: { _id: 1, price: 1 },
      store: { _id: 1, name: 1 },
      wareModel: { _id: 1 },
    },
  }).toArray();

  if (!stuffDoc.length) {
    throw new Error("Stuff not found");
  }

  const s = stuffDoc[0] as Record<string, unknown>;
  const stuffWareModelId = (s.wareModel as Record<string, unknown>)?._id?.toString();

  if (stuffWareModelId !== prWareModelId) {
    throw new Error("Selected stuff does not match the purchasing request's ware model");
  }

  const store = s.store as Record<string, unknown> | undefined;
  if (!store || !store._id) {
    throw new Error("Selected stuff has no associated store");
  }

  let unitPrice: number;
  if (s.hasAbsolutePrice) {
    unitPrice = s.price as number;
  } else if (s.pricePercentage) {
    const warePrice = (s.ware as Record<string, unknown>)?.price as number || 0;
    unitPrice = warePrice * (1 + (s.pricePercentage as number) / 100);
  } else {
    unitPrice = s.price as number;
  }

  const estimatedAmount = Math.round(unitPrice * quantity * 100) / 100;

  await purchasingRequest.findOneAndUpdate({
    filter: { _id: prId },
    update: {
      $set: {
        stuffStatus: "assigned",
        estimatedAmount,
        updatedAt: now,
      },
    },
    projection: { _id: 1 },
  });

  await purchasingRequest.addRelation({
    filters: { _id: prId },
    relations: {
      stuff: {
        _ids: new ObjectId(stuffId as string),
        relatedRelations: { purchasingRequests: true },
      },
      store: {
        _ids: store._id as ObjectId,
        relatedRelations: { purchasingRequests: true },
      },
    },
    projection: { _id: 1 },
    replace: true,
  });

  await purchasingRequest.findOneAndUpdate({
    filter: { _id: prId },
    update: {
      $push: {
        history: {
          action: "stuff_assigned",
          performed: {
            by: user._id.toString(),
            name: `${user.first_name} ${user.last_name}`,
            at: now,
            role: activeRole
              ? { id: activeRole.roleId, name: activeRole.name, scopeType: activeRole.scopeType, scopeId: activeRole.scopeId }
              : { id: "", name: "" },
          },
          details: {
            stuffId,
            estimatedAmount,
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
