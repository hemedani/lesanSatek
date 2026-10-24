import { type ActFn, type Document, ObjectId } from "lesan";
import { consumption } from "../../../mod.ts";
import { consumptionScopeMatch } from "../../../utils/consumptionScope.ts";
import { getAuth } from "../../../utils/grantAccess.ts";

export const getsFn: ActFn = async (body) => {
  const {
    set: {
      page,
      limit,
      skip,
      sortBy,
      sortOrder,
      unitId,
      wareModelId,
      reason,
      consumedFor,
    },
    get,
  } = body.details;

  const { user, activeRole } = await getAuth();
  const roleMatch = await consumptionScopeMatch(activeRole, user);

  const pipeline: Document[] = [];
  const requestedMatch: Document = {};

  unitId && (requestedMatch["unit._id"] = new ObjectId(unitId as string));
  wareModelId &&
    (requestedMatch["wareModel._id"] = new ObjectId(wareModelId as string));
  reason && (requestedMatch.reason = { $regex: reason, $options: "i" });
  consumedFor &&
    (requestedMatch.consumedFor = { $regex: consumedFor, $options: "i" });

  const hasRoleMatch = Object.keys(roleMatch).length > 0;
  const hasRequestedMatch = Object.keys(requestedMatch).length > 0;

  if (hasRoleMatch && hasRequestedMatch) {
    pipeline.push({ $match: { $and: [roleMatch, requestedMatch] } });
  } else if (hasRoleMatch) {
    pipeline.push({ $match: roleMatch });
  } else if (hasRequestedMatch) {
    pipeline.push({ $match: requestedMatch });
  }

  const sortField = sortBy || "_id";
  const sortDirection = sortOrder === "asc" ? 1 : -1;
  pipeline.push({ $sort: { [sortField]: sortDirection } });

  const calculatedSkip = skip ?? (limit || 50) * ((page || 1) - 1);
  pipeline.push({ $skip: calculatedSkip });
  pipeline.push({ $limit: limit || 50 });

  return await consumption
    .aggregation({
      pipeline,
      projection: get,
    })
    .toArray();
};
