import { type ActFn, type Document, ObjectId } from "lesan";
import { tender } from "../../../mod.ts";

export const getsFn: ActFn = async (body) => {
  const {
    set: {
      page,
      limit,
      skip,
      sortBy,
      sortOrder,
      title,
      status,
      purchasingRequestId,
    },
    get,
  } = body.details;

  const pipeline: Document[] = [];

  const match: Document = {};
  title && (match.title = { $regex: title, $options: "i" });
  status && (match.status = status);
  purchasingRequestId && (match.purchasingRequest = new ObjectId(purchasingRequestId as string));
  if (Object.keys(match).length > 0) {
    pipeline.push({ $match: match });
  }

  const sortField = sortBy || "_id";
  const sortDirection = sortOrder === "asc" ? 1 : -1;
  pipeline.push({ $sort: { [sortField]: sortDirection } });

  const calculatedSkip = skip ?? limit * (page - 1);
  pipeline.push({ $skip: calculatedSkip });
  pipeline.push({ $limit: limit });

  return await tender
    .aggregation({
      pipeline,
      projection: get,
    })
    .toArray();
};
