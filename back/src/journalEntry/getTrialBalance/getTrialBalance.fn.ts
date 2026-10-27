import { type ActFn, type Document, ObjectId } from "lesan";
import { journalEntryLine } from "../../../mod.ts";
import {
  accountingReadMatch,
  activeAccountingOrganizationId,
} from "../../../utils/accountingScope.ts";
import { getAuth } from "../../../utils/grantAccess.ts";
import {
  buildTrialBalance,
  type ReportRow,
} from "../../../utils/accountingMath.ts";

export const getTrialBalanceFn: ActFn = async (body) => {
  const {
    set: { organizationId, periodId, startDate, endDate },
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

  const pipeline: Document[] = [];
  readMatch && pipeline.push({ $match: readMatch });

  const match: Document = { "journalEntry.status": "posted" };
  if (!readMatch && organizationId) {
    match["organization._id"] = new ObjectId(organizationId as string);
  }
  if (periodId) match["period._id"] = new ObjectId(periodId as string);
  if (startDate || endDate) {
    match["journalEntry.entryDate"] = {
      ...(startDate ? { $gte: new Date(startDate as Date) } : {}),
      ...(endDate ? { $lte: new Date(endDate as Date) } : {}),
    };
  }

  pipeline.push({ $match: match });
  pipeline.push({
    $group: {
      _id: "$account._id",
      code: { $first: "$account.code" },
      name: { $first: "$account.name" },
      accountType: { $first: "$account.accountType" },
      normalBalance: { $first: "$account.normalBalance" },
      debit: { $sum: "$debit" },
      credit: { $sum: "$credit" },
    },
  });
  pipeline.push({ $sort: { code: 1 } });
  pipeline.push({
    $project: {
      _id: 1,
      code: 1,
      name: 1,
      accountType: 1,
      normalBalance: 1,
      debit: 1,
      credit: 1,
      balance: { $subtract: ["$debit", "$credit"] },
    },
  });

  const rows = await journalEntryLine.aggregation({ pipeline }).toArray();

  return buildTrialBalance(rows as ReportRow[]);
};
