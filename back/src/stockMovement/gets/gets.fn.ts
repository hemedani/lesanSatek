import { type ActFn, type Document, ObjectId } from "lesan";
import { stockMovement } from "../../../mod.ts";
import { getAuth } from "../../../utils/grantAccess.ts";
import { stockMovementReadMatch } from "../readScope.ts";

export const getsFn: ActFn = async (body) => {
  const {
    set: {
      page,
      limit,
      skip,
      sortBy,
      sortOrder,
      unitId,
      wareId,
      wareModelId,
      reason,
      referenceType,
      referenceId,
    },
    get,
  } = body.details;

  const { user, activeRole } = await getAuth();

  const pipeline: Document[] = [];
  const scopeMatch = await stockMovementReadMatch(activeRole, user);

  if (scopeMatch) {
    pipeline.push({ $match: scopeMatch });
  }

  const match: Document = {};

  unitId && (match["unit._id"] = new ObjectId(unitId as string));
  wareId && (match["ware._id"] = new ObjectId(wareId));
  wareModelId && (match["wareModel._id"] = new ObjectId(wareModelId));
  reason && (match.reason = reason);
  referenceType && (match.referenceType = referenceType);
  referenceId && (match.referenceId = referenceId);
  if (Object.keys(match).length > 0) {
    pipeline.push({ $match: match });
  }

  const sortField = sortBy || "_id";
  const sortDirection = sortOrder === "asc" ? 1 : -1;
  pipeline.push({ $sort: { [sortField]: sortDirection } });

  const calculatedSkip = skip ?? (limit || 50) * ((page || 1) - 1);
  pipeline.push({ $skip: calculatedSkip });
  pipeline.push({ $limit: limit || 50 });

  return await stockMovement
    .aggregation({
      pipeline,
      projection: get,
    })
    .toArray();
};
