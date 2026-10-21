import type { ActFn, Document } from "lesan";
import { ObjectId } from "lesan";
import { processStep } from "../../../mod.ts";
import { getAuth } from "../../../utils/grantAccess.ts";
import { processStepProcessIds } from "../readScope.ts";

export const getsFn: ActFn = async (body) => {
  const {
    set: {
      page,
      limit,
      skip,
      search,
      sortBy,
      sortOrder,
      processId,
    },
    get,
  } = body.details;

  const { user, activeRole } = await getAuth();
  const allowedProcessIds = await processStepProcessIds(activeRole, user);

  const pipeline: Document[] = [];

  search &&
    pipeline.push({
      $match: { $text: { $search: search } },
    });

  if (allowedProcessIds !== null) {
    pipeline.push({
      $match: { "process._id": { $in: allowedProcessIds } },
    });
  }

  processId &&
    pipeline.push({
      $match: { "process._id": new ObjectId(processId as string) },
    });

  if (search && (!sortBy || sortBy === "relevance")) {
    pipeline.push({
      $addFields: {
        textScore: { $meta: "textScore" },
      },
    });
  }

  const sortField = sortBy === "relevance" ? "textScore" : (sortBy || "order");
  const sortDirection = sortOrder === "asc" ? 1 : -1;
  pipeline.push({ $sort: { [sortField]: sortDirection } });

  const calculatedSkip = skip ?? (limit || 50) * ((page || 1) - 1);
  pipeline.push({ $skip: calculatedSkip });
  pipeline.push({ $limit: limit || 50 });

  return await processStep
    .aggregation({
      pipeline,
      projection: get,
    })
    .toArray();
};
