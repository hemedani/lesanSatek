import { type ActFn, type Document, ObjectId } from "lesan";
import { budgetLine } from "../../../mod.ts";

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

  const pipeline: Document[] = [];

  const match: Document = {};
  code && (match.code = { $regex: code, $options: "i" });
  title && (match.title = { $regex: title, $options: "i" });
  fiscalYearId && (match.fiscalYear = new ObjectId(fiscalYearId as string));
  organizationId && (match.organization = new ObjectId(organizationId as string));
  unitId && (match.unit = new ObjectId(unitId as string));
  if (Object.keys(match).length > 0) {
    pipeline.push({ $match: match });
  }

  const sortField = sortBy || "_id";
  const sortDirection = sortOrder === "asc" ? 1 : -1;
  pipeline.push({ $sort: { [sortField]: sortDirection } });

  const calculatedSkip = skip ?? limit * (page - 1);
  pipeline.push({ $skip: calculatedSkip });
  pipeline.push({ $limit: limit });

  return await budgetLine
    .aggregation({
      pipeline,
      projection: get,
    })
    .toArray();
};
