import { type ActFn, type Document, ObjectId } from "lesan";
import { budgetLine } from "../../../mod.ts";

export const getBudgetReportFn: ActFn = async (body) => {
  const {
    set: { fiscalYearId, organizationId },
  } = body.details;

  const match: Document = {
    "fiscalYear._id": new ObjectId(fiscalYearId as string),
  };
  organizationId && (match["organization._id"] = new ObjectId(organizationId as string));

  const pipeline: Document[] = [
    { $match: match },
    {
      $addFields: {
        allocatePct: {
          $cond: [
            { $gt: ["$totalAllocated", 0] },
            { $multiply: [{ $divide: ["$totalAllocated", "$totalAllocated"] }, 100] },
            0,
          ],
        },
        encumberPct: {
          $cond: [
            { $gt: ["$totalAllocated", 0] },
            {
              $multiply: [
                { $divide: ["$totalEncumbered", "$totalAllocated"] },
                100,
              ],
            },
            0,
          ],
        },
        spentPct: {
          $cond: [
            { $gt: ["$totalAllocated", 0] },
            {
              $multiply: [
                { $divide: ["$totalSpent", "$totalAllocated"] },
                100,
              ],
            },
            0,
          ],
        },
        status: {
          $cond: [
            { $gt: ["$remainingBudget", 0] },
            "under_budget",
            {
              $cond: [
                { $eq: ["$remainingBudget", 0] },
                "fully_utilized",
                "over_budget",
              ],
            },
          ],
        },
      },
    },
    { $sort: { code: 1 } },
  ];

  return await budgetLine
    .aggregation({
      pipeline,
      projection: {
        _id: 1,
        code: 1,
        title: 1,
        totalAllocated: 1,
        totalEncumbered: 1,
        totalSpent: 1,
        remainingBudget: 1,
        allocatePct: 1,
        encumberPct: 1,
        spentPct: 1,
        status: 1,
      },
    })
    .toArray();
};
