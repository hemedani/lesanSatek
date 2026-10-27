import { type ActFn, type Document, ObjectId } from "lesan";
import { journalEntryLine } from "../../../mod.ts";
import {
  accountingReadMatch,
  activeAccountingOrganizationId,
} from "../../../utils/accountingScope.ts";
import { getAuth } from "../../../utils/grantAccess.ts";
import {
  buildIncomeStatement,
  type ReportRow,
} from "../../../utils/accountingMath.ts";

export const getIncomeStatementFn: ActFn = async (body) => {
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

  const match: Document = {
    "journalEntry.status": "posted",
    "account.accountType": { $in: ["revenue", "expense"] },
  };

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
      debit: { $sum: "$debit" },
      credit: { $sum: "$credit" },
    },
  });
  pipeline.push({ $sort: { code: 1 } });

  const rows = await journalEntryLine.aggregation({ pipeline }).toArray();

  return buildIncomeStatement(rows as ReportRow[]);
};
