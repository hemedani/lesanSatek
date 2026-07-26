import { type ActFn, ObjectId } from "lesan";
import { budgetLine } from "../../../mod.ts";
import { checkFinanceUnitAccess } from "../../../utils/checkFinanceUnitAccess.ts";

export const removeFn: ActFn = async (body) => {
  await checkFinanceUnitAccess();
  const {
    set: { _id, hardCascade },
    get,
  } = body.details;

  return await budgetLine.deleteOne({
    filter: { _id: new ObjectId(_id as string) },
    hardCascade: hardCascade || false,
  });
};
