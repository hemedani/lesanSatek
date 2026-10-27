import { type ActFn, type Document, ObjectId } from "lesan";
import { journalEntry } from "../../../mod.ts";
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
      entryNumber,
      sourceType,
      status,
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
  entryNumber && (match.entryNumber = { $regex: entryNumber, $options: "i" });
  sourceType && (match.sourceType = sourceType);
  status && (match.status = status);
  periodId && (match["period._id"] = new ObjectId(periodId));

  if (startDate || endDate) {
    match.entryDate = {
      ...(startDate ? { $gte: new Date(startDate as Date) } : {}),
      ...(endDate ? { $lte: new Date(endDate as Date) } : {}),
    };
  }

  if (Object.keys(match).length > 0) pipeline.push({ $match: match });

  const sortField = sortBy || "entryDate";
  const sortDirection = sortOrder === "asc" ? 1 : -1;
  pipeline.push({ $sort: { [sortField]: sortDirection } });

  const calculatedSkip = skip ?? (limit || 50) * ((page || 1) - 1);
  pipeline.push({ $skip: calculatedSkip });
  pipeline.push({ $limit: limit || 50 });

  return await journalEntry.aggregation({ pipeline, projection: get })
    .toArray();
};
