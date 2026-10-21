import { type ActFn, ObjectId } from "lesan";
import { budgetLine } from "../../../mod.ts";
import {
  checkFinanceUnitAccess,
  financeTargetOfBudgetLine,
} from "../../../utils/checkFinanceUnitAccess.ts";

export const removeFn: ActFn = async (body) => {
  await checkFinanceUnitAccess(
    await financeTargetOfBudgetLine(body.details.set._id),
  );
  const {
    set: { _id, hardCascade },
    get,
  } = body.details;

  return await budgetLine.deleteOne({
    filter: { _id: new ObjectId(_id as string) },
    hardCascade: hardCascade || false,
  });
};
