import { type ActFn, type Document, ObjectId } from "lesan";
import { budgetLine } from "../../../mod.ts";

export const getYearEndReportFn: ActFn = async (body) => {
  const {
    set: { fiscalYearId, organizationId },
  } = body.details;

  const match: Document = {
    fiscalYear: new ObjectId(fiscalYearId as string),
  };
  organizationId && (match.organization = new ObjectId(organizationId as string));

  const pipeline: Document[] = [
    { $match: match },
    {
      $addFields: {
        surplus: {
          $cond: [
            { $gt: ["$remainingBudget", 0] },
            "$remainingBudget",
            0,
          ],
        },
        deficit: {
          $cond: [
            { $lt: ["$remainingBudget", 0] },
            { $abs: "$remainingBudget" },
            0,
          ],
        },
        utilizationPct: {
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
      },
    },
    { $sort: { code: 1 } },
    {
      $facet: {
        lines: [
          {
            $project: {
              _id: 1,
              code: 1,
              title: 1,
              totalAllocated: 1,
              totalSpent: 1,
              remainingBudget: 1,
              surplus: 1,
              deficit: 1,
              utilizationPct: 1,
            },
          },
        ],
        totals: [
          {
            $group: {
              _id: null,
              totalAllocated: { $sum: "$totalAllocated" },
              totalSpent: { $sum: "$totalSpent" },
              totalSurplus: { $sum: "$surplus" },
              totalDeficit: { $sum: "$deficit" },
              totalRemaining: { $sum: "$remainingBudget" },
              lineCount: { $sum: 1 },
            },
          },
        ],
      },
    },
  ];

  const result = await budgetLine
    .aggregation({
      pipeline,
      projection: {
        _id: 1,
        code: 1,
        title: 1,
        totalAllocated: 1,
        totalSpent: 1,
        remainingBudget: 1,
        surplus: 1,
        deficit: 1,
        utilizationPct: 1,
        lines: 1,
        totals: 1,
      },
    })
    .toArray();

  return {
    lines: result[0]?.lines || [],
    summary: result[0]?.totals?.[0] || {
      totalAllocated: 0,
      totalSpent: 0,
      totalSurplus: 0,
      totalDeficit: 0,
      totalRemaining: 0,
      lineCount: 0,
    },
  };
};
