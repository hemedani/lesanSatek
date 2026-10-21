import { type ActFn, ObjectId } from "lesan";
import { fiscalYear } from "../../../mod.ts";
import { checkFinanceUnitAccess } from "../../../utils/checkFinanceUnitAccess.ts";

export const addFn: ActFn = async (body) => {
  const { set, get } = body.details;

  const { activeRoleId, organizationId, ...rest } = set;

  await checkFinanceUnitAccess({
    organizationId: organizationId ? String(organizationId) : undefined,
  });

  return await fiscalYear.insertOne({
    doc: rest,
    projection: get,
    relations: { organization: { _ids: new ObjectId(organizationId as string) } },
  });
};
