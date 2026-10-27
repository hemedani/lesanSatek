import { type ActFn, type Document, ObjectId } from "lesan";
import { costCenter } from "../../../mod.ts";
import {
  accountingReadMatch,
  activeAccountingOrganizationId,
} from "../../../utils/accountingScope.ts";
import { getAuth } from "../../../utils/grantAccess.ts";

export const countFn: ActFn = async (body) => {
  const {
    set: { code, name, type, isActive, unitId, organizationId },
  } = body.details;

  const { user, activeRole } = await getAuth();
  const financeOrganizationId = await activeAccountingOrganizationId(
    activeRole,
    user,
  );
  const readMatch = accountingReadMatch(
    activeRole,
    user,
    financeOrganizationId,
  );

  const filter: Document = { ...(readMatch ?? {}) };
  organizationId && (filter["organization._id"] = new ObjectId(organizationId));
  code && (filter.code = { $regex: code, $options: "i" });
  name && (filter.name = { $regex: name, $options: "i" });
  type && (filter.type = type);
  isActive !== undefined && (filter.isActive = isActive);
  unitId && (filter["unit._id"] = unitId);

  return await costCenter.countDocument({ filter });
};
