import { type ActFn, type Document, ObjectId } from "lesan";
import { purchaseOrderItem } from "../../../mod.ts";

export const getsFn: ActFn = async (body) => {
  const {
    set: {
      page,
      limit,
      skip,
      sortBy,
      sortOrder,
      purchasingRequestId,
      status,
      wareModelId,
    },
    get,
  } = body.details;

  const pipeline: Document[] = [];

  const match: Document = {};
  purchasingRequestId && (match.purchasingRequest = new ObjectId(purchasingRequestId as string));
  status && (match.status = status);
  wareModelId && (match.wareModelId = wareModelId);
  if (Object.keys(match).length > 0) {
    pipeline.push({ $match: match });
  }

  const sortField = sortBy || "_id";
  const sortDirection = sortOrder === "asc" ? 1 : -1;
  pipeline.push({ $sort: { [sortField]: sortDirection } });

  const calculatedSkip = skip ?? limit * (page - 1);
  pipeline.push({ $skip: calculatedSkip });
  pipeline.push({ $limit: limit });

  return await purchaseOrderItem
    .aggregation({
      pipeline,
      projection: get,
    })
    .toArray();
};
