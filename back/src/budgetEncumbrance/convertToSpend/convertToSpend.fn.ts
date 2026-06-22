import { type ActFn, ObjectId } from "lesan";
import { budgetEncumbrance, budgetLine } from "../../../mod.ts";

export const convertToSpendFn: ActFn = async (body) => {
  const { set, get } = body.details;
  const { _id } = set;

  const encumbrance = await budgetEncumbrance.findOne({
    filters: { _id: new ObjectId(_id as string) },
    projection: { _id: 1, amount: 1, status: 1, budgetLine: 1 },
  }) as Record<string, unknown>;

  if (!encumbrance || (encumbrance.status as string) !== "reserved") {
    throw new Error("Encumbrance not found or already released/spent");
  }

  const amount = encumbrance.amount as number;
  const budgetLineId = (encumbrance.budgetLine as Record<string, unknown>)?._id as string;

  if (amount && budgetLineId) {
    const bl = await budgetLine.findOne({
      filters: { _id: new ObjectId(budgetLineId) },
      projection: { _id: 1, totalEncumbered: 1, totalSpent: 1, totalAllocated: 1 },
    }) as Record<string, unknown>;

    if (bl) {
      const currentEncumbered = (bl.totalEncumbered as number) || 0;
      const currentSpent = (bl.totalSpent as number) || 0;
      const currentAllocated = (bl.totalAllocated as number) || 0;
      await budgetLine.findOneAndUpdate({
        filter: { _id: new ObjectId(budgetLineId) },
        update: {
          $inc: { totalEncumbered: -amount, totalSpent: amount },
          $set: {
            remainingBudget: currentAllocated - (currentEncumbered - amount) - (currentSpent + amount),
            updatedAt: new Date(),
          },
        },
        projection: { _id: 1 },
      });
    }
  }

  return await budgetEncumbrance.findOneAndUpdate({
    filter: { _id: new ObjectId(_id as string) },
    update: {
      $set: {
        status: "spent",
        updatedAt: new Date(),
      },
    },
    projection: get,
  });
};
