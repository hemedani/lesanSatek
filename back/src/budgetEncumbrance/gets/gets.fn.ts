import { type ActFn, type Document, ObjectId } from "lesan";
import { budgetEncumbrance } from "../../../mod.ts";

export const getsFn: ActFn = async (body) => {
  const {
    set: {
      page,
      limit,
      skip,
      sortBy,
      sortOrder,
      budgetLineId,
    },
    get,
  } = body.details;

  const pipeline: Document[] = [];

  const match: Document = {};
  budgetLineId && (match["budgetLine._id"] = new ObjectId(budgetLineId as string));
  if (Object.keys(match).length > 0) {
    pipeline.push({ $match: match });
  }

  const sortField = sortBy || "_id";
  const sortDirection = sortOrder === "asc" ? 1 : -1;
  pipeline.push({ $sort: { [sortField]: sortDirection } });

  const calculatedSkip = skip ?? (limit || 50) * ((page || 1) - 1);
  pipeline.push({ $skip: calculatedSkip });
  pipeline.push({ $limit: limit || 50 });

  return await budgetEncumbrance
    .aggregation({
      pipeline,
      projection: get,
    })
    .toArray();
};
