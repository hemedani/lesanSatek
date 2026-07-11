import { type ActFn, type Document, ObjectId } from "lesan";
import { tenderOffer } from "../../../mod.ts";

export const getsFn: ActFn = async (body) => {
  const {
    set: {
      page,
      limit,
      skip,
      sortBy,
      sortOrder,
      tenderId,
      storeId,
      status,
    },
    get,
  } = body.details;

  const pipeline: Document[] = [];

  const match: Document = {};
  tenderId && (match.tender = new ObjectId(tenderId as string));
  storeId && (match.store = new ObjectId(storeId as string));
  status && (match.status = status);
  if (Object.keys(match).length > 0) {
    pipeline.push({ $match: match });
  }

  const sortField = sortBy || "_id";
  const sortDirection = sortOrder === "asc" ? 1 : -1;
  pipeline.push({ $sort: { [sortField]: sortDirection } });

  const calculatedSkip = skip ?? (limit || 50) * ((page || 1) - 1);
  pipeline.push({ $skip: calculatedSkip });
  pipeline.push({ $limit: limit || 50 });

  return await tenderOffer
    .aggregation({
      pipeline,
      projection: get,
    })
    .toArray();
};
