import { type ActFn, type Document, ObjectId } from "lesan";
import { unit } from "../../../mod.ts";

export const getsFn: ActFn = async (body) => {
  const {
    set: {
      page,
      limit,
      skip,
      search,
      sortBy,
      sortOrder,
      organizationId,
      type,
    },
    get,
  } = body.details;

  const pipeline: Document[] = [];

  search &&
    pipeline.push({
      $match: { $text: { $search: search } },
    });

  if (search && (!sortBy || sortBy === "relevance")) {
    pipeline.push({
      $addFields: {
        textScore: { $meta: "textScore" },
      },
    });
  }

  if (organizationId) {
    pipeline.push({
      $match: { "organization._id": new ObjectId(organizationId as string) },
    });
  }

  if (type) {
    pipeline.push({
      $match: { type },
    });
  }

  const sortField = sortBy === "relevance" ? "textScore" : (sortBy || "_id");
  const sortDirection = sortOrder === "asc" ? 1 : -1;
  pipeline.push({ $sort: { [sortField]: sortDirection } });

  const calculatedSkip = skip ?? (limit || 50) * ((page || 1) - 1);
  pipeline.push({ $skip: calculatedSkip });
  pipeline.push({ $limit: limit || 50 });

  return await unit
    .aggregation({
      pipeline,
      projection: get,
    })
    .toArray();
};
