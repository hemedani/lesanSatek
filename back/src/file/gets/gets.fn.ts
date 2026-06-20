import type { ActFn, Document } from "lesan";
import { file } from "../../../mod.ts";

export const getsFn: ActFn = async (body) => {
  const {
    set: { page, limit, skip, search, sortBy, sortOrder },
    get,
  } = body.details;

  const pipeline: Document[] = [];

  search &&
    pipeline.push({
      $match: { name: { $regex: search, $options: "i" } },
    });

  const sortField = sortBy || "_id";
  const sortDirection = sortOrder === "asc" ? 1 : -1;
  pipeline.push({ $sort: { [sortField]: sortDirection } });

  const calculatedSkip = skip ?? limit * (page - 1);
  pipeline.push({ $skip: calculatedSkip });
  pipeline.push({ $limit: limit });

  return await file
    .aggregation({
      pipeline,
      projection: get,
    })
    .toArray();
};
