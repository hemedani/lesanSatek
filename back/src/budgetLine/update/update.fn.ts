import { type ActFn, ObjectId } from "lesan";
import { budgetLine } from "../../../mod.ts";
import { checkFinanceUnitAccess } from "../../../utils/checkFinanceUnitAccess.ts";

export const updateFn: ActFn = async (body) => {
  await checkFinanceUnitAccess();
  const {
    set: { _id, ...fields },
    get,
  } = body.details;

  const updateObj: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined) {
      updateObj[key] = value;
    }
  }

  const affectsRemaining = ["totalAllocated", "totalEncumbered", "totalSpent"].some(
    (k) => k in updateObj,
  );
  if (affectsRemaining) {
    const current = await budgetLine.findOne({
      filters: { _id: new ObjectId(_id as string) },
      projection: { totalAllocated: 1, totalEncumbered: 1, totalSpent: 1 },
    }) as Record<string, unknown>;

    const newTotalAllocated = (updateObj.totalAllocated ?? current?.totalAllocated ?? 0) as number;
    const newTotalEncumbered = (updateObj.totalEncumbered ?? current?.totalEncumbered ?? 0) as number;
    const newTotalSpent = (updateObj.totalSpent ?? current?.totalSpent ?? 0) as number;
    updateObj.remainingBudget = newTotalAllocated - newTotalEncumbered - newTotalSpent;
  }

  return await budgetLine.findOneAndUpdate({
    filter: { _id: new ObjectId(_id as string) },
    update: { $set: updateObj },
    projection: get,
  });
};
