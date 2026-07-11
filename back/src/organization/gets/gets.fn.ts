import type { ActFn, Document } from "lesan";
import { organization } from "../../../mod.ts";

export const getsFn: ActFn = async (body) => {
  const {
    set: {
      activeRoleId,
      page,
      limit,
      skip,
      search,
      sortBy,
      sortOrder,
    },
    get,
  } = body.details;

  /*
   * 	@LOG @DEBUG @INFO
   * 	This log written by ::==> {{ `` }}
   *
   * 	Please remove your log after debugging
   */
  console.log(" ============= ");
  console.group("activeRoleId ------ ");
  console.log();
  console.info({ set: body.details.set }, " ------ ");
  console.log();
  console.groupEnd();
  console.log(" ============= ");

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

  const sortField = sortBy === "relevance" ? "textScore" : (sortBy || "_id");
  const sortDirection = sortOrder === "asc" ? 1 : -1;
  pipeline.push({ $sort: { [sortField]: sortDirection } });

  const calculatedSkip = skip ?? (limit || 50) * ((page || 1) - 1);
  pipeline.push({ $skip: calculatedSkip });
  pipeline.push({ $limit: limit || 50 });

  return await organization
    .aggregation({
      pipeline,
      projection: get,
    })
    .toArray();
};
