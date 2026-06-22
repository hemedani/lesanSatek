import { type ActFn, ObjectId } from "lesan";
import { budgetEncumbrance, budgetLine } from "../../../mod.ts";

export const addFn: ActFn = async (body) => {
  const { set, get } = body.details;

  const { activeRoleId, budgetLineId, createdById, ...rest } = set;

  const relations: Record<string, unknown> = {};

  relations.budgetLine = {
    _ids: new ObjectId(budgetLineId as string),
    relatedRelations: {
      encumbrances: true,
    },
  };

  if (createdById) {
    relations.createdBy = {
      _ids: new ObjectId(createdById as string),
      relatedRelations: {
        budgetEncumbrances: true,
      },
    };
  }

  const result = await budgetEncumbrance.insertOne({
    doc: { ...rest, status: "reserved" },
    relations,
    projection: get,
  });

  const amount = rest.amount as number;
  if (amount && budgetLineId) {
    const bl = await budgetLine.findOne({
      filters: { _id: new ObjectId(budgetLineId as string) },
      projection: { _id: 1, totalEncumbered: 1, totalAllocated: 1, totalSpent: 1 },
    }) as Record<string, unknown>;

    if (bl) {
      const currentEncumbered = (bl.totalEncumbered as number) || 0;
      const currentAllocated = (bl.totalAllocated as number) || 0;
      const currentSpent = (bl.totalSpent as number) || 0;
      await budgetLine.findOneAndUpdate({
        filter: { _id: new ObjectId(budgetLineId as string) },
        update: {
          $inc: { totalEncumbered: amount },
          $set: {
            remainingBudget: currentAllocated - (currentEncumbered + amount) - currentSpent,
            updatedAt: new Date(),
          },
        },
        projection: { _id: 1 },
      });
    }
  }

  return result;
};
