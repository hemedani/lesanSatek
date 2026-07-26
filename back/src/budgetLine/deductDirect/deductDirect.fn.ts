import { type ActFn, ObjectId } from "lesan";
import { budgetLine } from "../../../mod.ts";
import { checkFinanceUnitAccess } from "../../../utils/checkFinanceUnitAccess.ts";
import { throwError } from "../../../utils/throwError.ts";

export const deductDirectFn: ActFn = async (body) => {
  const { set, get } = body.details;
  const { _id, amount, description } = set;

  await checkFinanceUnitAccess();

  if ((amount as number) <= 0) {
    throwError("Amount must be positive");
  }

  const bl = await budgetLine.findOne({
    filters: { _id: new ObjectId(_id as string) },
    projection: {
      _id: 1,
      totalAllocated: 1,
      totalEncumbered: 1,
      totalSpent: 1,
      remainingBudget: 1,
    },
  }) as Record<string, unknown>;

  if (!bl) {
    throwError("Budget line not found");
  }

  const remainingBudget = (bl.remainingBudget as number) || 0;
  if (remainingBudget < (amount as number)) {
    throwError(
      `Insufficient budget: remaining (${remainingBudget}) is less than deduction amount (${amount})`,
    );
  }

  const currentAllocated = (bl.totalAllocated as number) || 0;
  const currentEncumbered = (bl.totalEncumbered as number) || 0;
  const currentSpent = (bl.totalSpent as number) || 0;

  await budgetLine.findOneAndUpdate({
    filter: { _id: new ObjectId(_id as string) },
    update: {
      $inc: { totalAllocated: -(amount as number) },
      $set: {
        remainingBudget: (currentAllocated - (amount as number)) - currentEncumbered - currentSpent,
        updatedAt: new Date(),
      },
    },
    projection: { _id: 1 },
  });

  return await budgetLine.findOne({
    filters: { _id: new ObjectId(_id as string) },
    projection: get,
  });
};
