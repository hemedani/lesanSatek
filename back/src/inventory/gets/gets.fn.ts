import { type ActFn, type Document, ObjectId } from "lesan";
import { inventory } from "../../../mod.ts";

export const getsFn: ActFn = async (body) => {
  const {
    set: {
      page,
      limit,
      skip,
      sortBy,
      sortOrder,
      wareModelId,
      unitId,
      warehouseUnitId,
    },
    get,
  } = body.details;

  const pipeline: Document[] = [];

  const match: Document = {};
  wareModelId && (match.wareModelId = wareModelId);
  unitId && (match.unit = new ObjectId(unitId as string));
  warehouseUnitId && (match.warehouseUnit = new ObjectId(warehouseUnitId as string));
  if (Object.keys(match).length > 0) {
    pipeline.push({ $match: match });
  }

  const sortField = sortBy || "_id";
  const sortDirection = sortOrder === "asc" ? 1 : -1;
  pipeline.push({ $sort: { [sortField]: sortDirection } });

  const calculatedSkip = skip ?? limit * (page - 1);
  pipeline.push({ $skip: calculatedSkip });
  pipeline.push({ $limit: limit });

  return await inventory
    .aggregation({
      pipeline,
      projection: get,
    })
    .toArray();
};
