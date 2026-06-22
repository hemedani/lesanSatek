import { type ActFn, type Document, ObjectId } from "lesan";
import { stockMovement } from "../../../mod.ts";

export const getsFn: ActFn = async (body) => {
  const {
    set: {
      page,
      limit,
      skip,
      sortBy,
      sortOrder,
      unitId,
      wareModelId,
      reason,
      referenceType,
      referenceId,
    },
    get,
  } = body.details;

  const pipeline: Document[] = [];

  const match: Document = {};
  unitId && (match.unit = new ObjectId(unitId as string));
  wareModelId && (match.wareModelId = wareModelId);
  reason && (match.reason = reason);
  referenceType && (match.referenceType = referenceType);
  referenceId && (match.referenceId = referenceId);
  if (Object.keys(match).length > 0) {
    pipeline.push({ $match: match });
  }

  const sortField = sortBy || "_id";
  const sortDirection = sortOrder === "asc" ? 1 : -1;
  pipeline.push({ $sort: { [sortField]: sortDirection } });

  const calculatedSkip = skip ?? limit * (page - 1);
  pipeline.push({ $skip: calculatedSkip });
  pipeline.push({ $limit: limit });

  return await stockMovement
    .aggregation({
      pipeline,
      projection: get,
    })
    .toArray();
};
