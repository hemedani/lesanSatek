import type { ActFn, Document } from "lesan";
import { ObjectId } from "lesan";
import { purchasingRequest } from "../../../mod.ts";

export const getsFn: ActFn = async (body) => {
  const {
    set: {
      page,
      limit,
      skip,
      search,
      status,
      processId,
      requesterId,
      filterByAction,
      sortBy,
      sortOrder,
      storeId,
      wareId,
      wareTypeId,
      wareClassId,
      wareGroupId,
    },
    get,
  } = body.details;

  const pipeline: Document[] = [];

  search &&
    pipeline.push({
      $match: { $text: { $search: search } },
    });

  status &&
    pipeline.push({
      $match: { status },
    });

  processId &&
    pipeline.push({
      $match: { "process._id": new ObjectId(processId as string) },
    });

  requesterId &&
    pipeline.push({
      $match: { "requester._id": new ObjectId(requesterId as string) },
    });

  filterByAction &&
    pipeline.push({
      $match: { "history.action": filterByAction },
    });

  storeId &&
    pipeline.push({
      $match: { "store._id": new ObjectId(storeId as string) },
    });

  wareId &&
    pipeline.push({
      $match: { "ware._id": new ObjectId(wareId as string) },
    });

  wareTypeId &&
    pipeline.push({
      $match: { "wareType._id": new ObjectId(wareTypeId as string) },
    });

  wareClassId &&
    pipeline.push({
      $match: { "wareClass._id": new ObjectId(wareClassId as string) },
    });

  wareGroupId &&
    pipeline.push({
      $match: { "wareGroup._id": new ObjectId(wareGroupId as string) },
    });

  if (search && (!sortBy || sortBy === "relevance")) {
    pipeline.push({
      $addFields: {
        textScore: { $meta: "textScore" },
      },
    });
  }

  const sortField = sortBy === "relevance" ? "textScore" : (sortBy || "_id");
  const sortDirection = sortOrder === "asc" ? 1 : -1;
  pipeline.push({ $sort: { [sortField]: sortDirection } });

  const calculatedSkip = skip ?? limit * (page - 1);
  pipeline.push({ $skip: calculatedSkip });
  pipeline.push({ $limit: limit });

  return await purchasingRequest
    .aggregation({
      pipeline,
      projection: get,
    })
    .toArray();
};
