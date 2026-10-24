import { type ActFn, type Document, ObjectId } from "lesan";
import { budgetLine } from "../../../mod.ts";
import {
  activeFinanceOrganizationId,
  budgetLineReadMatch,
} from "../../../utils/financeScope.ts";
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
      title,
      fiscalYearId,
      organizationId,
      unitId,
    },
    get,
  } = body.details;

  const { user, activeRole } = await getAuth();
  const financeOrganizationId = await activeFinanceOrganizationId(
    activeRole,
    user,
  );
  const readMatch = budgetLineReadMatch(
    activeRole,
    user,
    financeOrganizationId,
  );

  const pipeline: Document[] = [];

  readMatch && pipeline.push({ $match: readMatch });

  const match: Document = {};
  code && (match.code = { $regex: code, $options: "i" });
  title && (match.title = { $regex: title, $options: "i" });
  fiscalYearId && (match["fiscalYear._id"] = new ObjectId(fiscalYearId as string));
  organizationId && (match["organization._id"] = new ObjectId(organizationId as string));
  unitId && (match["unit._id"] = new ObjectId(unitId as string));
  if (Object.keys(match).length > 0) {
    pipeline.push({ $match: match });
  }

  const sortField = sortBy || "_id";
  const sortDirection = sortOrder === "asc" ? 1 : -1;
  pipeline.push({ $sort: { [sortField]: sortDirection } });

  const calculatedSkip = skip ?? (limit || 50) * ((page || 1) - 1);
  pipeline.push({ $skip: calculatedSkip });
  pipeline.push({ $limit: limit || 50 });

  return await budgetLine
    .aggregation({
      pipeline,
      projection: get,
    })
    .toArray();
};
