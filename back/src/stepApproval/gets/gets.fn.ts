import { type ActFn, type Document, ObjectId } from "lesan";
import { stepApproval } from "../../../mod.ts";
import { getAuth } from "../../../utils/grantAccess.ts";
import { stepApprovalAllowedUnitIds } from "../readScope.ts";

export const getsFn: ActFn = async (body) => {
  const {
    set: {
      page,
      limit,
      skip,
      sortBy,
      sortOrder,
      purchasingRequestId,
      processStepId,
      unitId,
      status,
    },
    get,
  } = body.details;

  const { user, activeRole } = await getAuth();
  const allowedUnitIds = await stepApprovalAllowedUnitIds(activeRole, user);

  const pipeline: Document[] = [];

  if (allowedUnitIds !== null) {
    pipeline.push({ $match: { "unit._id": { $in: allowedUnitIds } } });
  }

  const match: Document = {};
  purchasingRequestId &&
    (match["purchasingRequest._id"] = new ObjectId(
      purchasingRequestId as string,
    ));
  processStepId &&
    (match["processStep._id"] = new ObjectId(processStepId as string));
  unitId && (match["unit._id"] = new ObjectId(unitId as string));
  status && (match.status = status);
  if (Object.keys(match).length > 0) {
    pipeline.push({ $match: match });
  }

  const sortField = sortBy || "_id";
  const sortDirection = sortOrder === "asc" ? 1 : -1;
  pipeline.push({ $sort: { [sortField]: sortDirection } });

  const calculatedSkip = skip ?? (limit || 50) * ((page || 1) - 1);
  pipeline.push({ $skip: calculatedSkip });
  pipeline.push({ $limit: limit || 50 });

  return await stepApproval
    .aggregation({
      pipeline,
      projection: get,
    })
    .toArray();
};
