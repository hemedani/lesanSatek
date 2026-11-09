import { type Document, ObjectId } from "lesan";

/**
 * Statuses for which a purchasing request can no longer need an approval
 * decision. Anything outside this list is considered "open".
 */
export const PENDING_APPROVAL_TERMINAL_STATUSES = [
  "PendingFinalization",
  "Completed",
  "Rejected",
  "Cancelled",
];

export type PendingApprovalScope = {
  /**
   * Units whose approval queue is being read.
   * - `null`  → no unit restriction (manager/admin, or an org-wide queue)
   * - `[]`    → the actor has no queue at all
   * - `[id]`  → restrict to the current step's assignee units
   */
  unitIds?: string[] | null;
  /** Restrict the queue to one organization (used by OrgHead). */
  organizationId?: string | null;
  /** Full-text search on the request. */
  search?: string;
};

const toObjectId = (value: string): ObjectId | null => {
  try {
    return new ObjectId(value);
  } catch {
    return null;
  }
};

const normalizeIds = (ids: string[]): string[] =>
  [...new Set(ids.map((id) => String(id)).filter((id) => id.length > 0))];

/**
 * Builds the aggregation stages that answer a single question:
 *
 *   "Which open purchasing requests is this unit expected to approve right now?"
 *
 * The queue is derived from the **current step's assignee units**, not from the
 * request's `requestingUnit`. A unit head approves requests raised by *other*
 * units, so scoping the queue by `requestingUnit` always yields an empty list.
 *
 * The returned pipeline stops before `$sort`/`$skip`/`$limit` so callers can
 * either paginate (the pending list) or `$count` (dashboard statistics) while
 * sharing exactly the same definition of "pending".
 */
export const buildPendingApprovalPipeline = (
  scope: PendingApprovalScope,
): Document[] => {
  const { unitIds = null, organizationId = null, search } = scope;

  const pipeline: Document[] = [
    {
      $match: {
        status: { $nin: PENDING_APPROVAL_TERMINAL_STATUSES },
      },
    },
  ];

  if (search) {
    pipeline.push({ $match: { $text: { $search: search } } });
  }

  if (organizationId) {
    const organizationObjId = toObjectId(organizationId);
    if (!organizationObjId) {
      pipeline.push({ $match: { _id: { $in: [] } } });
      return pipeline;
    }
    pipeline.push({
      $match: { "organization._id": { $in: [organizationObjId] } },
    });
  }

  if (unitIds === null) return pipeline;

  const scopedUnitIds = normalizeIds(unitIds);

  if (scopedUnitIds.length === 0) {
    pipeline.push({ $match: { _id: { $in: [] } } });
    return pipeline;
  }

  const scopedUnitObjIds = scopedUnitIds
    .map(toObjectId)
    .filter((id): id is ObjectId => id !== null);

  if (scopedUnitObjIds.length === 0) {
    pipeline.push({ $match: { _id: { $in: [] } } });
    return pipeline;
  }

  pipeline.push(
    // Resolve the ordered step list of the request's process.
    {
      $lookup: {
        from: "processStep",
        let: { processId: "$process._id" },
        pipeline: [
          { $match: { $expr: { $eq: ["$process._id", "$$processId"] } } },
          { $sort: { order: 1 } },
          { $project: { _id: 1, name: 1, assigneeGroups: 1 } },
        ],
        as: "__steps",
      },
    },
    // A request without steps cannot be awaiting a step approval.
    { $match: { __steps: { $ne: [] } } },
    {
      $addFields: {
        // `currentStep` is a 0-based index into the ordered step list.
        __currentStep: {
          $arrayElemAt: [
            "$__steps",
            { $ifNull: ["$currentStep", 0] },
          ],
        },
      },
    },
    // The unit must be an assignee of the step the request is sitting on.
    {
      $match: {
        "__currentStep.assigneeGroups.unitIds": { $in: scopedUnitIds },
      },
    },
    // Pull this unit's decisions for the current step.
    {
      $lookup: {
        from: "stepApproval",
        let: { prId: "$_id", stepId: "$__currentStep._id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$purchasingRequest._id", "$$prId"] },
                  { $eq: ["$processStep._id", "$$stepId"] },
                  { $in: ["$unit._id", scopedUnitObjIds] },
                ],
              },
            },
          },
          { $project: { _id: 1, status: 1 } },
        ],
        as: "__approvals",
      },
    },
    // Already decided (approved/rejected) → not pending anymore.
    {
      $match: {
        $or: [
          { __approvals: { $size: 0 } },
          { "__approvals.status": "pending" },
        ],
      },
    },
    { $project: { __steps: 0, __currentStep: 0, __approvals: 0 } },
  );

  return pipeline;
};
