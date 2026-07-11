import { type ActFn, type Document, ObjectId } from "lesan";
import { paymentOrder } from "../../../mod.ts";

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
      financialUnitId,
    },
    get,
  } = body.details;

  const pipeline: Document[] = [];

  const match: Document = {};
  purchasingRequestId && (match.purchasingRequest = new ObjectId(purchasingRequestId as string));
  status && (match.status = status);
  financialUnitId && (match.financialUnit = new ObjectId(financialUnitId as string));
  if (Object.keys(match).length > 0) {
    pipeline.push({ $match: match });
  }

  const sortField = sortBy || "_id";
  const sortDirection = sortOrder === "asc" ? 1 : -1;
  pipeline.push({ $sort: { [sortField]: sortDirection } });

  const calculatedSkip = skip ?? (limit || 50) * ((page || 1) - 1);
  pipeline.push({ $skip: calculatedSkip });
  pipeline.push({ $limit: limit || 50 });

  return await paymentOrder
    .aggregation({
      pipeline,
      projection: get,
    })
    .toArray();
};
