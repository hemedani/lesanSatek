import { type ActFn, type Document, ObjectId } from "lesan";
import { account, journalEntryLine } from "../../../mod.ts";
import { isScopeBypass } from "../../../utils/authzPolicy.ts";
import {
  accountingDocumentOrganizationId,
  accountingReadMatch,
  activeAccountingOrganizationId,
  assertCanReadAccountingDocument,
} from "../../../utils/accountingScope.ts";
import { getAuth } from "../../../utils/grantAccess.ts";
import { throwError } from "../../../utils/throwError.ts";
import { roundMoney } from "../../../utils/accountingMath.ts";

const money = roundMoney;

export const getGeneralLedgerFn: ActFn = async (body) => {
  const {
    set: { accountId, periodId, startDate, endDate },
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

  const accountObjectId = new ObjectId(accountId as string);
  const accountDoc = await account.findOne({
    filters: { _id: accountObjectId },
    projection: {
      _id: 1,
      code: 1,
      name: 1,
      accountType: 1,
      normalBalance: 1,
      organization: { _id: 1 },
    },
  }) as Document | null;

  if (!accountDoc) {
    if (!isScopeBypass(activeRole, user)) throwError("You cant do this");
    throwError("Account not found");
  }

  assertCanReadAccountingDocument(
    activeRole,
    user,
    accountingDocumentOrganizationId(accountDoc),
    financeOrganizationId,
  );

  const baseMatch: Document = {
    "account._id": accountObjectId,
    "journalEntry.status": "posted",
  };

  if (readMatch) Object.assign(baseMatch, readMatch);
  if (periodId) baseMatch["period._id"] = new ObjectId(periodId as string);

  let openingBalance = 0;

  if (startDate) {
    const openingPipeline: Document[] = [
      {
        $match: {
          ...baseMatch,
          "journalEntry.entryDate": { $lt: new Date(startDate as Date) },
        },
      },
      {
        $group: {
          _id: null,
          debit: { $sum: "$debit" },
          credit: { $sum: "$credit" },
        },
      },
    ];

    const openingRows = await journalEntryLine
      .aggregation({ pipeline: openingPipeline })
      .toArray();

    openingBalance = money(
      (Number(openingRows[0]?.debit) || 0) -
        (Number(openingRows[0]?.credit) || 0),
    );
  }

  const rangeMatch: Document = { ...baseMatch };
  if (startDate || endDate) {
    rangeMatch["journalEntry.entryDate"] = {
      ...(startDate ? { $gte: new Date(startDate as Date) } : {}),
      ...(endDate ? { $lte: new Date(endDate as Date) } : {}),
    };
  }

  const pipeline: Document[] = [
    { $match: rangeMatch },
    { $sort: { "journalEntry.entryDate": 1, lineNumber: 1 } },
    {
      $project: {
        _id: 1,
        lineNumber: 1,
        description: 1,
        debit: 1,
        credit: 1,
        entryId: "$journalEntry._id",
        entryNumber: "$journalEntry.entryNumber",
        entryDate: "$journalEntry.entryDate",
        costCenterId: "$costCenter._id",
        costCenterName: "$costCenter.name",
        storeId: "$store._id",
        storeName: "$store.name",
      },
    },
  ];

  const rows = await journalEntryLine.aggregation({ pipeline }).toArray();

  let running = openingBalance;
  let totalDebit = 0;
  let totalCredit = 0;

  const lines = rows.map((row) => {
    const debit = money(Number(row.debit) || 0);
    const credit = money(Number(row.credit) || 0);
    running = money(running + debit - credit);
    totalDebit = money(totalDebit + debit);
    totalCredit = money(totalCredit + credit);

    return {
      _id: String(row._id),
      lineNumber: Number(row.lineNumber) || 0,
      description: row.description ? String(row.description) : null,
      debit,
      credit,
      runningBalance: running,
      entryId: row.entryId ? String(row.entryId) : null,
      entryNumber: row.entryNumber ? String(row.entryNumber) : null,
      entryDate: row.entryDate ?? null,
      costCenterId: row.costCenterId ? String(row.costCenterId) : null,
      costCenterName: row.costCenterName ? String(row.costCenterName) : null,
      storeId: row.storeId ? String(row.storeId) : null,
      storeName: row.storeName ? String(row.storeName) : null,
    };
  });

  return {
    account: {
      _id: String(accountDoc!._id),
      code: String(accountDoc!.code ?? ""),
      name: String(accountDoc!.name ?? ""),
      accountType: String(accountDoc!.accountType ?? ""),
      normalBalance: String(accountDoc!.normalBalance ?? ""),
    },
    openingBalance,
    lines,
    totals: {
      debit: totalDebit,
      credit: totalCredit,
    },
    closingBalance: running,
  };
};
