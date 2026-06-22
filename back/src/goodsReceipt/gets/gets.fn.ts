import { type ActFn, type Document, ObjectId } from "lesan";
import { goodsReceipt } from "../../../mod.ts";

export const getsFn: ActFn = async (body) => {
  const {
    set: {
      page,
      limit,
      skip,
      sortBy,
      sortOrder,
      purchasingRequestId,
      receivingUnitId,
      status,
    },
    get,
  } = body.details;

  const pipeline: Document[] = [];

  const match: Document = {};
  purchasingRequestId && (match.purchasingRequest = new ObjectId(purchasingRequestId as string));
  receivingUnitId && (match.receivingUnit = new ObjectId(receivingUnitId as string));
  status && (match.status = status);
  if (Object.keys(match).length > 0) {
    pipeline.push({ $match: match });
  }

  const sortField = sortBy || "_id";
  const sortDirection = sortOrder === "asc" ? 1 : -1;
  pipeline.push({ $sort: { [sortField]: sortDirection } });

  const calculatedSkip = skip ?? limit * (page - 1);
  pipeline.push({ $skip: calculatedSkip });
  pipeline.push({ $limit: limit });

  return await goodsReceipt
    .aggregation({
      pipeline,
      projection: get,
    })
    .toArray();
};
