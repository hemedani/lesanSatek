import { type ActFn, type Document, ObjectId } from "lesan";
import { accountingPeriod } from "../../../mod.ts";
import {
  accountingReadMatch,
  activeAccountingOrganizationId,
} from "../../../utils/accountingScope.ts";
import { getAuth } from "../../../utils/grantAccess.ts";

export const countFn: ActFn = async (body) => {
  const {
    set: { code, status, startDate, endDate, organizationId },
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
  status && (filter.status = status);
  startDate && (filter.startDate = { $gte: new Date(startDate as Date) });
  endDate && (filter.endDate = { $lte: new Date(endDate as Date) });

  return await accountingPeriod.countDocument({ filter });
};
