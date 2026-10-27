import { type ActFn, type Document, ObjectId } from "lesan";
import { journalEntryLine } from "../../../mod.ts";
import {
  accountingReadMatch,
  activeAccountingOrganizationId,
} from "../../../utils/accountingScope.ts";
import { getAuth } from "../../../utils/grantAccess.ts";

export const getsFn: ActFn = async (body) => {
  const {
    set: {
      page,
      limit,
      skip,
      sortBy,
      sortOrder,
      journalEntryId,
      accountId,
      costCenterId,
      storeId,
      periodId,
      startDate,
      endDate,
      organizationId,
    },
    get,
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

  const match: Document = {};
  organizationId && (match["organization._id"] = new ObjectId(organizationId));
  journalEntryId &&
    (match["journalEntry._id"] = new ObjectId(journalEntryId));
  accountId && (match["account._id"] = new ObjectId(accountId));
  costCenterId && (match["costCenter._id"] = new ObjectId(costCenterId));
  storeId && (match["store._id"] = new ObjectId(storeId));
  periodId && (match["period._id"] = new ObjectId(periodId));

  if (startDate || endDate) {
    match["journalEntry.entryDate"] = {
      ...(startDate ? { $gte: new Date(startDate as Date) } : {}),
      ...(endDate ? { $lte: new Date(endDate as Date) } : {}),
    };
  }

  if (Object.keys(match).length > 0) pipeline.push({ $match: match });

  const sortField = sortBy || "lineNumber";
  const sortDirection = sortOrder === "desc" ? -1 : 1;
  pipeline.push({ $sort: { [sortField]: sortDirection } });

  const calculatedSkip = skip ?? (limit || 50) * ((page || 1) - 1);
  pipeline.push({ $skip: calculatedSkip });
  pipeline.push({ $limit: limit || 50 });

  return await journalEntryLine
    .aggregation({ pipeline, projection: get })
    .toArray();
};
