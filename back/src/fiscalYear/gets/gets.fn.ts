import { type ActFn, type Document } from "lesan";
import { fiscalYear } from "../../../mod.ts";
import {
  activeFinanceOrganizationId,
  fiscalYearReadMatch,
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
      name,
      status,
      isActive,
    },
    get,
  } = body.details;

  const { user, activeRole } = await getAuth();
  const financeOrganizationId = await activeFinanceOrganizationId(
    activeRole,
    user,
  );
  const readMatch = fiscalYearReadMatch(
    activeRole,
    user,
    financeOrganizationId,
  );

  const pipeline: Document[] = [];

  readMatch && pipeline.push({ $match: readMatch });

  const match: Document = {};
  name && (match.name = { $regex: name, $options: "i" });
  status && (match.status = status);
  isActive !== undefined && (match.isActive = isActive);

  if (Object.keys(match).length > 0) {
    pipeline.push({ $match: match });
  }

  const sortField = sortBy || "_id";
  const sortDirection = sortOrder === "asc" ? 1 : -1;
  pipeline.push({ $sort: { [sortField]: sortDirection } });

  const calculatedSkip = skip ?? (limit || 50) * ((page || 1) - 1);
  pipeline.push({ $skip: calculatedSkip });
  pipeline.push({ $limit: limit || 50 });

  return await fiscalYear
    .aggregation({
      pipeline,
      projection: get,
    })
    .toArray();
};
