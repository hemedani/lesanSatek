import type { ActFn, Document } from "lesan";
import { ObjectId } from "lesan";
import { purchasingRequest } from "../../../mod.ts";
import { getAuth } from "../../../utils/grantAccess.ts";
import { throwError } from "../../../utils/throwError.ts";
import { purchasingRequestReadMatch } from "../readScope.ts";

export const getPendingByUnitFn: ActFn = async (body) => {
  const {
    set: { unitId: rawUnitId, page, limit, search },
    get,
  } = body.details;

  const { user, activeRole } = await getAuth();
  const readMatch = purchasingRequestReadMatch(activeRole, user);

  let unitId = rawUnitId;

  if (!unitId) {
    if (
      activeRole.name === "UnitHead" &&
      activeRole.scopeType === "unit" &&
      activeRole.scopeId
    ) {
      unitId = activeRole.scopeId;
    } else if (activeRole.name !== "StoreHead") {
      throwError("Unit ID is required");
    }
  }

  const calculatedSkip = (limit || 50) * ((page || 1) - 1);

  const pipeline: Document[] = [
    {
      $match: {
        status: {
          $nin: ["PendingFinalization", "Completed", "Rejected", "Cancelled"],
        },
      },
    },
  ];

  if (search) {
    pipeline[0].$match.$text = { $search: search };
  }

  readMatch && pipeline.push({ $match: readMatch });

  if (unitId) {
    const unitObjId = new ObjectId(unitId as string);

    pipeline.push(
      {
        $lookup: {
          from: "processStep",
          let: { processId: "$process._id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$process._id", "$$processId"] } } },
            { $sort: { order: 1 } },
          ],
          as: "steps",
        },
      },
      { $match: { steps: { $ne: [] } } },
      {
        $addFields: {
          currentStepDoc: { $arrayElemAt: ["$steps", "$currentStep"] },
        },
      },
      {
        $match: {
          "currentStepDoc.assigneeGroups.unitIds": unitId,
        },
      },
      {
        $lookup: {
          from: "stepApproval",
          let: { prId: "$_id", stepId: "$currentStepDoc._id", uId: unitObjId },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$purchasingRequest._id", "$$prId"] },
                    { $eq: ["$processStep._id", "$$stepId"] },
                    { $eq: ["$unit._id", "$$uId"] },
                  ],
                },
              },
            },
          ],
          as: "approvals",
        },
      },
      {
        $match: {
          $or: [
            { approvals: { $size: 0 } },
            { "approvals.status": "pending" },
          ],
        },
      },
      { $project: { steps: 0, currentStepDoc: 0, approvals: 0 } },
    );
  }

  pipeline.push(
    { $sort: { createdAt: -1 } },
    { $skip: calculatedSkip },
    { $limit: limit || 50 },
  );

  return await purchasingRequest
    .aggregation({
      pipeline,
      projection: get,
    })
    .toArray();
};
