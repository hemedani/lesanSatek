import type { ActFn, Document } from "lesan";
import { ObjectId } from "lesan";
import { purchasingRequest, coreApp } from "../../../mod.ts";
import type { MyContext } from "@lib";
import { throwError } from "../../../utils/throwError.ts";

export const getPendingByUnitFn: ActFn = async (body) => {
  const {
    set: { unitId: rawUnitId, page, limit, search },
    get,
  } = body.details;

  const { user }: MyContext = coreApp.contextFns.getContextModel() as MyContext;

  const activeRole = (user.roles || []).find(
    (r: { roleId: string }) => r.roleId === body.details.set.activeRoleId,
  ) as { name: string; scopeType?: string; scopeId?: string } | undefined;

  if (!activeRole) {
    throwError("Active role not found");
    return;
  }

  let unitId = rawUnitId;
  if (!unitId) {
    if (activeRole.scopeType === "unit" && activeRole.scopeId) {
      unitId = activeRole.scopeId;
    } else {
      throwError("Unit ID is required");
      return;
    }
  }

  const unitObjId = new ObjectId(unitId as string);
  const calculatedSkip = (limit || 50) * ((page || 1) - 1);

  const pipeline: Document[] = [
    {
      $match: {
        status: { $nin: ["PendingFinalization", "Completed", "Rejected", "Cancelled"] },
      },
    },
  ];

  if (search) {
    pipeline[0].$match.$text = { $search: search };
  }

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
