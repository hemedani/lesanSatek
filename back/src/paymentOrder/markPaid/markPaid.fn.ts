import { type ActFn, ObjectId } from "lesan";
import { paymentOrder, budgetEncumbrance, budgetLine, purchasingRequest } from "../../../mod.ts";

export const markPaidFn: ActFn = async (body) => {
  const { set, get } = body.details;
  const { _id } = set;

  const order = await paymentOrder.findOne({
    filters: { _id: new ObjectId(_id as string) },
    projection: { _id: 1, purchasingRequest: 1, amount: 1 },
  }) as Record<string, unknown>;

  const now = new Date();

  const result = await paymentOrder.findOneAndUpdate({
    filter: { _id: new ObjectId(_id as string) },
    update: {
      $set: {
        status: "paid",
        paidAt: now,
        updatedAt: now,
      },
    },
    projection: get,
  });

  // Auto-convert related encumbrances to spent
  if (order) {
    const prRef = (order.purchasingRequest as Record<string, unknown>)?._id as string;
    if (prRef) {
      const encumbrances = await budgetEncumbrance.aggregation({
        pipeline: [
          {
            $match: {
              referenceType: "purchasingRequest",
              referenceId: prRef,
              status: "reserved",
            },
          },
          { $project: { _id: 1, amount: 1, budgetLine: 1 } },
        ],
        projection: { _id: 1, amount: 1, budgetLine: 1 },
      }).toArray();

      for (const enc of encumbrances) {
        const encId = enc._id as ObjectId;
        const encAmount = enc.amount as number;
        const blId = (enc.budgetLine as Record<string, unknown>)?._id as string;

        await budgetEncumbrance.findOneAndUpdate({
          filter: { _id: encId },
          update: { $set: { status: "spent", updatedAt: now } },
          projection: { _id: 1 },
        });

        if (blId) {
          const bl = await budgetLine.findOne({
            filters: { _id: new ObjectId(blId) },
            projection: { _id: 1, totalEncumbered: 1, totalSpent: 1, totalAllocated: 1 },
          }) as Record<string, unknown>;

          if (bl) {
            const currentEncumbered = (bl.totalEncumbered as number) || 0;
            const currentSpent = (bl.totalSpent as number) || 0;
            const currentAllocated = (bl.totalAllocated as number) || 0;
            await budgetLine.findOneAndUpdate({
              filter: { _id: new ObjectId(blId) },
              update: {
                $inc: { totalEncumbered: -encAmount, totalSpent: encAmount },
                $set: {
                  remainingBudget: currentAllocated - (currentEncumbered - encAmount) - (currentSpent + encAmount),
                  updatedAt: now,
                },
              },
              projection: { _id: 1 },
            });
          }
        }
      }
    }
  }

  // Deduct payment amount from budget line's totalAllocated
  if (order) {
    const prRef = (order.purchasingRequest as Record<string, unknown>)?._id as string;
    if (prRef) {
      const prDoc = await purchasingRequest.findOne({
        filters: { _id: new ObjectId(prRef) },
        projection: { budgetLine: { _id: 1 } },
      }) as Record<string, unknown> | null;

      const prBlId = (prDoc?.budgetLine as Record<string, unknown>)?._id as string;
      const paymentAmount = (order.amount as number) || 0;

      if (prBlId && paymentAmount > 0) {
        const bl = await budgetLine.findOne({
          filters: { _id: new ObjectId(prBlId) },
          projection: { _id: 1, totalAllocated: 1, totalEncumbered: 1, totalSpent: 1 },
        }) as Record<string, unknown>;

        if (bl) {
          const currentAllocated = (bl.totalAllocated as number) || 0;
          const currentEncumbered = (bl.totalEncumbered as number) || 0;
          const currentSpent = (bl.totalSpent as number) || 0;
          await budgetLine.findOneAndUpdate({
            filter: { _id: new ObjectId(prBlId) },
            update: {
              $inc: { totalAllocated: -paymentAmount },
              $set: {
                remainingBudget: (currentAllocated - paymentAmount) - currentEncumbered - currentSpent,
                updatedAt: new Date(),
              },
            },
            projection: { _id: 1 },
          });
        }
      }
    }
  }

  return result;
};
