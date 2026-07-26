import { type ActFn, ObjectId } from "lesan";
import { budgetAllocation } from "../../../mod.ts";
import { checkFinanceUnitAccess } from "../../../utils/checkFinanceUnitAccess.ts";

export const removeFn: ActFn = async (body) => {
  await checkFinanceUnitAccess();
  const {
    set: { _id, hardCascade },
    get,
  } = body.details;

  return await budgetAllocation.deleteOne({
    filter: { _id: new ObjectId(_id as string) },
    hardCascade: hardCascade || false,
  });
};
