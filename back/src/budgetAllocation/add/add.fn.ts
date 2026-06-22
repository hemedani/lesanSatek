import { type ActFn, ObjectId } from "lesan";
import { budgetAllocation, budgetLine } from "../../../mod.ts";

export const addFn: ActFn = async (body) => {
  const { set, get } = body.details;

  const { activeRoleId, budgetLineId, allocatedById, ...rest } = set;

  const relations: Record<string, unknown> = {};

  relations.budgetLine = {
    _ids: new ObjectId(budgetLineId as string),
    relatedRelations: {
      allocations: true,
    },
  };

  if (allocatedById) {
    relations.allocatedBy = {
      _ids: new ObjectId(allocatedById as string),
      relatedRelations: {
        budgetAllocations: true,
      },
    };
  }

  const result = await budgetAllocation.insertOne({
    doc: rest,
    relations,
    projection: get,
  });

  const amount = rest.amount as number;
  if (amount && budgetLineId) {
    const bl = await budgetLine.findOne({
      filters: { _id: new ObjectId(budgetLineId as string) },
      projection: { _id: 1, totalAllocated: 1, totalSpent: 1 },
    }) as Record<string, unknown>;

    if (bl) {
      const currentAllocated = (bl.totalAllocated as number) || 0;
      const currentSpent = (bl.totalSpent as number) || 0;
      await budgetLine.findOneAndUpdate({
        filter: { _id: new ObjectId(budgetLineId as string) },
        update: {
          $inc: { totalAllocated: amount },
          $set: {
            remainingBudget: currentAllocated + amount - currentSpent,
            updatedAt: new Date(),
          },
        },
        projection: { _id: 1 },
      });
    }
  }

  return result;
};
