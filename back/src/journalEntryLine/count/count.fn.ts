import { type ActFn, type Document, ObjectId } from "lesan";
import { journalEntryLine } from "../../../mod.ts";
import {
  accountingReadMatch,
  activeAccountingOrganizationId,
} from "../../../utils/accountingScope.ts";
import { getAuth } from "../../../utils/grantAccess.ts";

export const countFn: ActFn = async (body) => {
  const {
    set: {
      journalEntryId,
      accountId,
      costCenterId,
      storeId,
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
  journalEntryId &&
    (filter["journalEntry._id"] = new ObjectId(journalEntryId));
  accountId && (filter["account._id"] = new ObjectId(accountId));
  costCenterId && (filter["costCenter._id"] = new ObjectId(costCenterId));
  storeId && (filter["store._id"] = new ObjectId(storeId));
  periodId && (filter["period._id"] = new ObjectId(periodId));

  if (startDate || endDate) {
    filter["journalEntry.entryDate"] = {
      ...(startDate ? { $gte: new Date(startDate as Date) } : {}),
      ...(endDate ? { $lte: new Date(endDate as Date) } : {}),
    };
  }

  return await journalEntryLine.countDocument({ filter });
};
