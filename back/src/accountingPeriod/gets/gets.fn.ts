import { type ActFn, type Document, ObjectId } from "lesan";
import { accountingPeriod } from "../../../mod.ts";
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
      code,
      status,
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
  code && (match.code = { $regex: code, $options: "i" });
  status && (match.status = status);
  startDate && (match.startDate = { $gte: new Date(startDate as Date) });
  endDate && (match.endDate = { $lte: new Date(endDate as Date) });

  if (Object.keys(match).length > 0) pipeline.push({ $match: match });

  const sortField = sortBy || "startDate";
  const sortDirection = sortOrder === "asc" ? 1 : -1;
  pipeline.push({ $sort: { [sortField]: sortDirection } });

  const calculatedSkip = skip ?? (limit || 50) * ((page || 1) - 1);
  pipeline.push({ $skip: calculatedSkip });
  pipeline.push({ $limit: limit || 50 });

  return await accountingPeriod
    .aggregation({ pipeline, projection: get })
    .toArray();
};
