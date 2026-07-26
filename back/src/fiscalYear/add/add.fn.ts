import { type ActFn, ObjectId } from "lesan";
import { fiscalYear } from "../../../mod.ts";
import { checkFinanceUnitAccess } from "../../../utils/checkFinanceUnitAccess.ts";

export const addFn: ActFn = async (body) => {
  await checkFinanceUnitAccess();
  const { set, get } = body.details;

  const { activeRoleId, ...rest } = set;

  return await fiscalYear.insertOne({
    doc: rest,
    projection: get,
  });
};
