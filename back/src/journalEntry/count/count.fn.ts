import { type ActFn, type Document, ObjectId } from "lesan";
import { journalEntry } from "../../../mod.ts";
import {
  accountingReadMatch,
  activeAccountingOrganizationId,
} from "../../../utils/accountingScope.ts";
import { getAuth } from "../../../utils/grantAccess.ts";

export const countFn: ActFn = async (body) => {
  const {
    set: {
      entryNumber,
      sourceType,
      status,
      periodId,
      startDate,
      endDate,
      organizationId,
    },
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
  entryNumber && (filter.entryNumber = { $regex: entryNumber, $options: "i" });
  sourceType && (filter.sourceType = sourceType);
  status && (filter.status = status);
  periodId && (filter["period._id"] = new ObjectId(periodId));

  if (startDate || endDate) {
    filter.entryDate = {
      ...(startDate ? { $gte: new Date(startDate as Date) } : {}),
      ...(endDate ? { $lte: new Date(endDate as Date) } : {}),
    };
  }

  return await journalEntry.countDocument({ filter });
};
