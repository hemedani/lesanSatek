import { type ActFn, ObjectId } from "lesan";
import { fiscalYear } from "../../../mod.ts";
import {
  checkFinanceUnitAccess,
  financeTargetOfFiscalYear,
} from "../../../utils/checkFinanceUnitAccess.ts";

export const removeFn: ActFn = async (body) => {
  await checkFinanceUnitAccess(
    await financeTargetOfFiscalYear(body.details.set._id),
  );

  const {
    set: { _id, hardCascade },
  } = body.details;

  return await fiscalYear.deleteOne({
    filter: { _id: new ObjectId(_id as string) },
    hardCascade: hardCascade || false,
  });
};
