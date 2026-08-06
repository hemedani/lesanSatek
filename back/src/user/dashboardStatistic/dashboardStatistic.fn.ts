import type { ActFn, Document } from "lesan";
import { ObjectId } from "lesan";
import {
  purchasingRequest,
  stepApproval,
  budgetLine,
  paymentOrder,
  fiscalYear,
  unit,
  inventory,
  consumption,
  stockMovement,
  coreApp,
} from "../../../mod.ts";
import type { MyContext } from "@lib";
import { throwError } from "../../../utils/throwError.ts";

export const dashboardStatisticFn: ActFn = async (body) => {
  const {
    set: { activeRoleId, unitId: paramUnitId, orgId: paramOrgId, type: statType },
    get,
  } = body.details;

  const { user }: MyContext = coreApp.contextFns.getContextModel() as MyContext;

  const activeRole = (user.roles || []).find(
    (r: { roleId: string }) => r.roleId === activeRoleId,
  ) as { name: string; scopeType?: string; scopeId?: string } | undefined;

  if (!activeRole) {
    throwError("Active role not found");
    return;
  }

  let effectiveUnitId: ObjectId | null = null;
  let effectiveOrgId: ObjectId | null = null;

  if (statType === "orgHead") {
    if (activeRole.scopeType === "organization" && activeRole.scopeId) {
      effectiveOrgId = new ObjectId(activeRole.scopeId);
    } else if (paramOrgId) {
      effectiveOrgId = new ObjectId(paramOrgId as string);
    } else {
      throwError("OrgHead role must have an organization scope");
      return;
    }
  } else if (activeRole.name === "UnitHead") {
    if (activeRole.scopeType === "unit" && activeRole.scopeId) {
      effectiveUnitId = new ObjectId(activeRole.scopeId);
    } else {
      throwError("UnitHead role must have a unit scope");
      return;
    }
  } else {
    if (paramUnitId) {
      effectiveUnitId = new ObjectId(paramUnitId as string);
    }
    if (paramOrgId) {
      effectiveOrgId = new ObjectId(paramOrgId as string);
    }
  }

  const result: Record<string, unknown> = {};
  const tasks: Promise<void>[] = [];

  let unitType: string | null = null;
  let unitOrgId: ObjectId | null = null;

  if (effectiveUnitId) {
    const unitDocs = await unit.aggregation({
      pipeline: [{ $match: { _id: effectiveUnitId } }],
      projection: { _id: 1, name: 1, type: 1, organization: { _id: 1 } },
    }).toArray();
    if (unitDocs.length > 0) {
      unitType = unitDocs[0].type as string;
      unitOrgId = unitDocs[0].organization?._id
        ? new ObjectId(unitDocs[0].organization._id as string)
        : null;
      if (get.unit === 1) {
        result.unit = { _id: unitDocs[0]._id, name: unitDocs[0].name, type: unitDocs[0].type };
      }
    }
  }

  const prFacet: Record<string, unknown[]> = {};

  if (get.purchasingRequestCounts === 1) {
    prFacet.purchasingRequestCounts = [
      {
        $group: {
          _id: null,
          draft: { $sum: { $cond: [{ $eq: ["$status", "Draft"] }, 1, 0] } },
          pending: { $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] } },
          approved: { $sum: { $cond: [{ $eq: ["$status", "Approved"] }, 1, 0] } },
          rejected: { $sum: { $cond: [{ $eq: ["$status", "Rejected"] }, 1, 0] } },
          total: { $sum: 1 },
        },
      },
    ];
  }

  if (get.receiptCount === 1) {
    if (!effectiveUnitId || unitType === "Warehouse") {
      prFacet.receiptCount = [
        { $match: { stuffStatus: "received" } },
        { $count: "count" },
      ];
    }
  }

  if (Object.keys(prFacet).length > 0) {
    const prMatch: Document = {};
    if (effectiveUnitId) {
      prMatch["requestingUnit._id"] = effectiveUnitId;
    } else if (effectiveOrgId) {
      prMatch["organization._id"] = effectiveOrgId;
    }

    const pipeline: Document[] = [];
    if (Object.keys(prMatch).length > 0) {
      pipeline.push({ $match: prMatch });
    }
    pipeline.push({ $facet: prFacet });

    tasks.push(
      purchasingRequest.aggregation({ pipeline })
        .toArray()
        .then((arr) => {
          const facet = arr[0] || {};
          if (facet.purchasingRequestCounts?.[0]) {
            const c = facet.purchasingRequestCounts[0];
            result.purchasingRequestCounts = {
              draft: c.draft,
              pending: c.pending,
              approved: c.approved,
              rejected: c.rejected,
              total: c.total,
            };
          } else {
            result.purchasingRequestCounts = {
              draft: 0,
              pending: 0,
              approved: 0,
              rejected: 0,
              total: 0,
            };
          }
          if (facet.receiptCount?.[0]) {
            result.receiptCount = facet.receiptCount[0].count;
          } else if (prFacet.receiptCount) {
            result.receiptCount = 0;
          }
        }),
    );
  }

  if (get.pendingApprovalCount === 1 || get.recentApprovals === 1) {
    const saFacet: Record<string, unknown[]> = {};
    const saMatch: Document = {};

    if (effectiveUnitId) {
      saMatch["unit._id"] = effectiveUnitId;
    }

    if (get.pendingApprovalCount === 1) {
      saFacet.pendingApprovalCount = [
        { $match: { status: "pending" } },
        { $count: "count" },
      ];
    }

    if (get.recentApprovals === 1) {
      saFacet.recentApprovals = [
        { $match: { status: "pending" } },
        { $sort: { createdAt: -1 } },
        { $limit: 5 },
        { $project: { _id: 1, status: 1, createdAt: 1 } },
      ];
    }

    const pipeline: Document[] = [];
    if (Object.keys(saMatch).length > 0) {
      pipeline.push({ $match: saMatch });
    }
    pipeline.push({ $facet: saFacet });

    tasks.push(
      stepApproval.aggregation({ pipeline })
        .toArray()
        .then((arr) => {
          const facet = arr[0] || {};
          if (facet.pendingApprovalCount?.[0]) {
            result.pendingApprovalCount = facet.pendingApprovalCount[0].count;
          } else if (get.pendingApprovalCount === 1) {
            result.pendingApprovalCount = 0;
          }
          result.recentApprovals = (facet.recentApprovals || []);
        }),
    );
  }

  if (get.finance === 1) {
    if (!effectiveUnitId || unitType === "Finance") {
      const blMatch: Document = {};
      if (effectiveUnitId && unitType === "Finance" && unitOrgId) {
        blMatch["organization._id"] = unitOrgId;
      } else if (effectiveUnitId) {
        blMatch["unit._id"] = effectiveUnitId;
      } else if (effectiveOrgId) {
        blMatch["organization._id"] = effectiveOrgId;
      }

      const blPipeline: Document[] = [];
      if (Object.keys(blMatch).length > 0) {
        blPipeline.push({ $match: blMatch });
      }
      blPipeline.push({
        $group: {
          _id: null,
          budgetLineCount: { $sum: 1 },
          totalAllocated: { $sum: "$totalAllocated" },
          totalSpent: { $sum: "$totalSpent" },
          totalRemaining: { $sum: "$remainingBudget" },
        },
      });

      tasks.push(
        budgetLine.aggregation({ pipeline: blPipeline })
          .toArray()
          .then((arr) => {
            if (arr[0]) {
              result.finance = {
                ...((result.finance || {}) as Record<string, unknown>),
                budgetLineCount: arr[0].budgetLineCount,
                totalAllocated: arr[0].totalAllocated,
                totalSpent: arr[0].totalSpent,
                totalRemaining: arr[0].totalRemaining,
              };
            } else {
              result.finance = {
                ...((result.finance || {}) as Record<string, unknown>),
                budgetLineCount: 0,
                totalAllocated: 0,
                totalSpent: 0,
                totalRemaining: 0,
              };
            }
          }),
      );

      const poMatch: Document = { status: "sent_to_finance" };
      if (effectiveUnitId && unitType !== "Finance") {
        poMatch["financialUnit._id"] = effectiveUnitId;
      }

      tasks.push(
        paymentOrder.aggregation({
          pipeline: [
            { $match: poMatch },
            { $count: "count" },
          ],
        }).toArray().then((arr) => {
          result.finance = {
            ...((result.finance || {}) as Record<string, unknown>),
            pendingPaymentCount: (arr[0]?.count || 0) as number,
          };
        }),
      );
    }
  }

  if (get.fiscalYear === 1) {
    const fyMatch: Document = {};
    if (effectiveOrgId) {
      fyMatch["organization._id"] = effectiveOrgId;
    }

    tasks.push(
      fiscalYear.aggregation({
        pipeline: [
          ...(Object.keys(fyMatch).length > 0 ? [{ $match: fyMatch }] : []),
          {
            $facet: {
              active: [
                { $match: { isActive: true } },
                { $limit: 1 },
                {
                  $project: {
                    _id: 1,
                    name: 1,
                    startDate: 1,
                    endDate: 1,
                    isActive: 1,
                    status: 1,
                  },
                },
              ],
              count: [
                { $count: "total" },
              ],
            },
          },
        ],
      }).toArray().then((arr) => {
        const facet = arr[0] || {};
        result.fiscalYear = {
          count: facet.count?.[0]?.total || 0,
          active: facet.active?.[0] || null,
        };
      }),
    );
  }

  if (get.paymentOrders === 1) {
    if (!effectiveUnitId || unitType === "Finance") {
      const poMatch: Document = {};
      if (effectiveUnitId && unitType !== "Finance") {
        poMatch["financialUnit._id"] = effectiveUnitId;
      }

      tasks.push(
        paymentOrder.aggregation({
          pipeline: [
            ...(Object.keys(poMatch).length > 0 ? [{ $match: poMatch }] : []),
            {
              $facet: {
                byStatus: [
                  {
                    $group: {
                      _id: "$status",
                      count: { $sum: 1 },
                    },
                  },
                ],
              },
            },
          ],
        }).toArray().then((arr) => {
          const facet = arr[0] || {};
          const groups: Record<string, number> = {};
          for (const g of (facet.byStatus || [])) {
            groups[g._id as string] = g.count;
          }
          result.paymentOrders = {
            draft: groups.draft || 0,
            sent_to_finance: groups["sent_to_finance"] || 0,
            paid: groups.paid || 0,
            cancelled: groups.cancelled || 0,
          };
        }),
      );
    }
  }

  // ═══════════════════════════════════════════════════════════════
  //  ORGHEAD ANALYTICS FACETS
  // ═══════════════════════════════════════════════════════════════

  const orgMatch: Document = {};
  if (effectiveOrgId) {
    orgMatch["organization._id"] = effectiveOrgId;
  }

  const unitOrgMatch: Document = {};
  if (effectiveOrgId) {
    const orgUnits = await unit.aggregation({
      pipeline: [
        { $match: { "organization._id": effectiveOrgId } },
        { $project: { _id: 1 } },
      ],
    }).toArray();
    if (orgUnits.length > 0) {
      unitOrgMatch["unit._id"] = {
        $in: orgUnits.map((u: Document) => u._id),
      };
    }
  }

  // ── 1. prStatusDistribution — full breakdown by ALL statuses ──
  if (get.prStatusDistribution === 1) {
    const prMatch: Document = {};
    if (effectiveUnitId) {
      prMatch["requestingUnit._id"] = effectiveUnitId;
    } else if (effectiveOrgId) {
      prMatch["organization._id"] = effectiveOrgId;
    }

    tasks.push(
      purchasingRequest.aggregation({
        pipeline: [
          ...(Object.keys(prMatch).length > 0 ? [{ $match: prMatch }] : []),
          {
            $group: {
              _id: null,
              draft: { $sum: { $cond: [{ $eq: ["$status", "Draft"] }, 1, 0] } },
              pending: { $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] } },
              inProgress: { $sum: { $cond: [{ $eq: ["$status", "InProgress"] }, 1, 0] } },
              approved: { $sum: { $cond: [{ $eq: ["$status", "Approved"] }, 1, 0] } },
              pendingFinalization: { $sum: { $cond: [{ $eq: ["$status", "PendingFinalization"] }, 1, 0] } },
              rejected: { $sum: { $cond: [{ $eq: ["$status", "Rejected"] }, 1, 0] } },
              completed: { $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] } },
              cancelled: { $sum: { $cond: [{ $eq: ["$status", "Cancelled"] }, 1, 0] } },
            },
          },
        ],
      }).toArray().then((arr) => {
        if (arr[0]) {
          result.prStatusDistribution = {
            draft: arr[0].draft,
            pending: arr[0].pending,
            inProgress: arr[0].inProgress,
            approved: arr[0].approved,
            pendingFinalization: arr[0].pendingFinalization,
            rejected: arr[0].rejected,
            completed: arr[0].completed,
            cancelled: arr[0].cancelled,
          };
        } else {
          result.prStatusDistribution = {
            draft: 0, pending: 0, inProgress: 0, approved: 0,
            pendingFinalization: 0, rejected: 0, completed: 0, cancelled: 0,
          };
        }
      }),
    );
  }

  // ── 2. prMonthlyTrend — PR creation over last 12 months ──
  if (get.prMonthlyTrend === 1) {
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const prMatch: Document = { requestedAt: { $gte: twelveMonthsAgo } };
    if (effectiveUnitId) {
      prMatch["requestingUnit._id"] = effectiveUnitId;
    } else if (effectiveOrgId) {
      prMatch["organization._id"] = effectiveOrgId;
    }

    tasks.push(
      purchasingRequest.aggregation({
        pipeline: [
          { $match: prMatch },
          {
            $group: {
              _id: {
                year: { $year: "$requestedAt" },
                month: { $month: "$requestedAt" },
              },
              count: { $sum: 1 },
              totalEstimatedAmount: { $sum: { $ifNull: ["$estimatedAmount", 0] } },
            },
          },
          { $sort: { "_id.year": 1, "_id.month": 1 } },
          {
            $project: {
              _id: 0,
              year: "$_id.year",
              month: "$_id.month",
              count: 1,
              totalEstimatedAmount: 1,
            },
          },
        ],
      }).toArray().then((arr) => {
        result.prMonthlyTrend = arr || [];
      }),
    );
  }

  // ── 3. prCycleTime — avg/min/max days from submit to complete ──
  if (get.prCycleTime === 1) {
    const prMatch: Document = {
      status: "Completed",
      requestedAt: { $exists: true, $ne: null },
      completedAt: { $exists: true, $ne: null },
    };
    if (effectiveUnitId) {
      prMatch["requestingUnit._id"] = effectiveUnitId;
    } else if (effectiveOrgId) {
      prMatch["organization._id"] = effectiveOrgId;
    }

    tasks.push(
      purchasingRequest.aggregation({
        pipeline: [
          { $match: prMatch },
          {
            $project: {
              cycleDays: {
                $divide: [
                  { $subtract: ["$completedAt", "$requestedAt"] },
                  86400000,
                ],
              },
            },
          },
          {
            $group: {
              _id: null,
              averageDays: { $avg: "$cycleDays" },
              minDays: { $min: "$cycleDays" },
              maxDays: { $max: "$cycleDays" },
              totalCompleted: { $sum: 1 },
            },
          },
        ],
      }).toArray().then((arr) => {
        if (arr[0]) {
          result.prCycleTime = {
            averageDays: Math.round((arr[0].averageDays as number) * 100) / 100,
            minDays: Math.round((arr[0].minDays as number) * 100) / 100,
            maxDays: Math.round((arr[0].maxDays as number) * 100) / 100,
            totalCompleted: arr[0].totalCompleted,
          };
        } else {
          result.prCycleTime = { averageDays: 0, minDays: 0, maxDays: 0, totalCompleted: 0 };
        }
      }),
    );
  }

  // ── 4. budgetLineBreakdown — per-budget-line details ──
  if (get.budgetLineBreakdown === 1) {
    const blMatch: Document = { ...orgMatch };

    tasks.push(
      budgetLine.aggregation({
        pipeline: [
          ...(Object.keys(blMatch).length > 0 ? [{ $match: blMatch }] : []),
          {
            $project: {
              _id: 1,
              code: 1,
              title: 1,
              totalAllocated: 1,
              totalEncumbered: 1,
              totalSpent: 1,
              remainingBudget: 1,
            },
          },
          { $sort: { totalAllocated: -1 } },
        ],
      }).toArray().then((arr) => {
        result.budgetLineBreakdown = arr || [];
      }),
    );
  }

  // ── 5. budgetBurnDown — active fiscal year summary ──
  if (get.budgetBurnDown === 1) {
    const blMatch: Document = { ...orgMatch };

    tasks.push(
      budgetLine.aggregation({
        pipeline: [
          ...(Object.keys(blMatch).length > 0 ? [{ $match: blMatch }] : []),
          {
            $group: {
              _id: null,
              totalAllocated: { $sum: "$totalAllocated" },
              totalEncumbered: { $sum: "$totalEncumbered" },
              totalSpent: { $sum: "$totalSpent" },
              totalRemaining: { $sum: "$remainingBudget" },
            },
          },
        ],
      }).toArray().then((arr) => {
        if (arr[0]) {
          result.budgetBurnDown = {
            totalAllocated: arr[0].totalAllocated,
            totalEncumbered: arr[0].totalEncumbered,
            totalSpent: arr[0].totalSpent,
            totalRemaining: arr[0].totalRemaining,
          };
        } else {
          result.budgetBurnDown = {
            totalAllocated: 0, totalEncumbered: 0, totalSpent: 0, totalRemaining: 0,
          };
        }
      }),
    );
  }

  // ── 6. inventorySummary — total items + by-wareType breakdown ──
  if (get.inventorySummary === 1) {
    const invMatch: Document = { ...unitOrgMatch };

    tasks.push(
      inventory.aggregation({
        pipeline: [
          ...(Object.keys(invMatch).length > 0 ? [{ $match: invMatch }] : []),
          {
            $facet: {
              total: [
                {
                  $group: {
                    _id: null,
                    totalItems: { $sum: 1 },
                    totalQuantity: { $sum: "$quantity" },
                  },
                },
              ],
              byWareType: [
                { $match: { "wareType._id": { $exists: true, $ne: null } } },
                {
                  $group: {
                    _id: "$wareType._id",
                    name: { $first: "$wareType.name" },
                    enName: { $first: "$wareType.enName" },
                    count: { $sum: 1 },
                    totalQuantity: { $sum: "$quantity" },
                  },
                },
                { $sort: { totalQuantity: -1 } },
              ],
            },
          },
        ],
      }).toArray().then((arr) => {
        const facet = arr[0] || {};
        const total = facet.total?.[0];
        result.inventorySummary = {
          totalItems: total?.totalItems || 0,
          totalQuantity: total?.totalQuantity || 0,
          byWareType: facet.byWareType || [],
        };
      }),
    );
  }

  // ── 7. inventoryLowStock — items below minQuantity ──
  if (get.inventoryLowStock === 1) {
    const invMatch: Document = {
      ...unitOrgMatch,
      minQuantity: { $exists: true, $ne: null },
    };

    tasks.push(
      inventory.aggregation({
        pipeline: [
          { $match: invMatch },
          {
            $match: {
              $expr: { $lt: ["$quantity", "$minQuantity"] },
            },
          },
          {
            $facet: {
              count: [{ $count: "count" }],
              items: [
                { $sort: { quantity: 1 } },
                { $limit: 20 },
                {
                  $project: {
                    _id: 1,
                    quantity: 1,
                    minQuantity: 1,
                    ware: { _id: 1, name: 1 },
                    unit: { _id: 1, name: 1 },
                    wareModel: { _id: 1, name: 1 },
                  },
                },
              ],
            },
          },
        ],
      }).toArray().then((arr) => {
        const facet = arr[0] || {};
        result.inventoryLowStock = {
          count: facet.count?.[0]?.count || 0,
          items: facet.items || [],
        };
      }),
    );
  }

  // ── 8. consumptionTrend — monthly consumption last 12 months ──
  if (get.consumptionTrend === 1) {
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const conMatch: Document = { consumedAt: { $gte: twelveMonthsAgo }, ...unitOrgMatch };

    tasks.push(
      consumption.aggregation({
        pipeline: [
          { $match: conMatch },
          {
            $group: {
              _id: {
                year: { $year: "$consumedAt" },
                month: { $month: "$consumedAt" },
              },
              totalQuantity: { $sum: "$quantity" },
              count: { $sum: 1 },
            },
          },
          { $sort: { "_id.year": 1, "_id.month": 1 } },
          {
            $project: {
              _id: 0,
              year: "$_id.year",
              month: "$_id.month",
              totalQuantity: 1,
              count: 1,
            },
          },
        ],
      }).toArray().then((arr) => {
        result.consumptionTrend = arr || [];
      }),
    );
  }

  // ── 9. consumptionByUnit — top 5 consuming units ──
  if (get.consumptionByUnit === 1) {
    const conMatch: Document = { ...unitOrgMatch };

    tasks.push(
      consumption.aggregation({
        pipeline: [
          ...(Object.keys(conMatch).length > 0 ? [{ $match: conMatch }] : []),
          {
            $group: {
              _id: "$unit._id",
              unitName: { $first: "$unit.name" },
              totalQuantity: { $sum: "$quantity" },
              count: { $sum: 1 },
            },
          },
          { $sort: { totalQuantity: -1 } },
          { $limit: 5 },
        ],
      }).toArray().then((arr) => {
        result.consumptionByUnit = arr || [];
      }),
    );
  }

  // ── 10. consumptionByCategory — consumption by wareType ──
  if (get.consumptionByCategory === 1) {
    const conMatch: Document = {
      ...unitOrgMatch,
      "wareType._id": { $exists: true, $ne: null },
    };

    tasks.push(
      consumption.aggregation({
        pipeline: [
          { $match: conMatch },
          {
            $group: {
              _id: "$wareType._id",
              name: { $first: "$wareType.name" },
              enName: { $first: "$wareType.enName" },
              totalQuantity: { $sum: "$quantity" },
              count: { $sum: 1 },
            },
          },
          { $sort: { totalQuantity: -1 } },
        ],
      }).toArray().then((arr) => {
        result.consumptionByCategory = arr || [];
      }),
    );
  }

  // ── 11. procurementByStore — total PR spending by store ──
  if (get.procurementByStore === 1) {
    const prMatch: Document = {
      "store._id": { $exists: true, $ne: null },
      status: { $in: ["Completed", "Approved"] },
    };
    if (effectiveUnitId) {
      prMatch["requestingUnit._id"] = effectiveUnitId;
    } else if (effectiveOrgId) {
      prMatch["organization._id"] = effectiveOrgId;
    }

    tasks.push(
      purchasingRequest.aggregation({
        pipeline: [
          { $match: prMatch },
          {
            $group: {
              _id: "$store._id",
              storeName: { $first: "$store.name" },
              totalPRs: { $sum: 1 },
              totalEstimatedAmount: { $sum: { $ifNull: ["$estimatedAmount", 0] } },
            },
          },
          { $sort: { totalEstimatedAmount: -1 } },
        ],
      }).toArray().then((arr) => {
        result.procurementByStore = arr || [];
      }),
    );
  }

  // ── 12. selectionBreakdown — stuff vs tender selection count ──
  if (get.selectionBreakdown === 1) {
    const prMatch: Document = { selectionType: { $in: ["stuff", "tender", "none"] } };
    if (effectiveUnitId) {
      prMatch["requestingUnit._id"] = effectiveUnitId;
    } else if (effectiveOrgId) {
      prMatch["organization._id"] = effectiveOrgId;
    }

    tasks.push(
      purchasingRequest.aggregation({
        pipeline: [
          { $match: prMatch },
          {
            $group: {
              _id: null,
              stuff: { $sum: { $cond: [{ $eq: ["$selectionType", "stuff"] }, 1, 0] } },
              tender: { $sum: { $cond: [{ $eq: ["$selectionType", "tender"] }, 1, 0] } },
              none: { $sum: { $cond: [{ $eq: ["$selectionType", "none"] }, 1, 0] } },
            },
          },
        ],
      }).toArray().then((arr) => {
        if (arr[0]) {
          result.selectionBreakdown = {
            stuff: arr[0].stuff,
            tender: arr[0].tender,
            none: arr[0].none,
          };
        } else {
          result.selectionBreakdown = { stuff: 0, tender: 0, none: 0 };
        }
      }),
    );
  }

  // ── 13. stockMovementSummary — total in/out grouped by reason ──
  if (get.stockMovementSummary === 1) {
    const smMatch: Document = { ...unitOrgMatch };

    tasks.push(
      stockMovement.aggregation({
        pipeline: [
          ...(Object.keys(smMatch).length > 0 ? [{ $match: smMatch }] : []),
          {
            $group: {
              _id: "$reason",
              totalQuantity: { $sum: "$quantity" },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ],
      }).toArray().then((arr) => {
        const byReason = arr || [];
        const totalIn = byReason
          .filter((r: Record<string, unknown>) => (r.totalQuantity as number) > 0)
          .reduce((sum: number, r: Record<string, unknown>) => sum + (r.totalQuantity as number), 0);
        const totalOut = byReason
          .filter((r: Record<string, unknown>) => (r.totalQuantity as number) < 0)
          .reduce((sum: number, r: Record<string, unknown>) => sum + Math.abs(r.totalQuantity as number), 0);
        result.stockMovementSummary = {
          totalIn,
          totalOut,
          byReason,
        };
      }),
    );
  }

  // ── 14. stepBottleneck — avg approval time by step ──
  if (get.stepBottleneck === 1) {
    const saMatch: Document = {
      decidedAt: { $exists: true, $ne: null },
      "processStep.name": { $exists: true, $ne: null },
    };

    tasks.push(
      stepApproval.aggregation({
        pipeline: [
          { $match: saMatch },
          {
            $addFields: {
              startTime: {
                $ifNull: [
                  "$createdAt",
                  { $toDate: "$_id" },
                ],
              },
            },
          },
          {
            $project: {
              stepName: "$processStep.name",
              stepType: "$processStep.stepType",
              hours: {
                $divide: [
                  { $subtract: ["$decidedAt", "$startTime"] },
                  3600000,
                ],
              },
            },
          },
          {
            $group: {
              _id: { name: "$stepName", type: "$stepType" },
              avgHours: { $avg: "$hours" },
              minHours: { $min: "$hours" },
              maxHours: { $max: "$hours" },
              count: { $sum: 1 },
            },
          },
          { $sort: { avgHours: -1 } },
          {
            $project: {
              _id: 0,
              stepName: "$_id.name",
              stepType: "$_id.type",
              avgHours: { $round: ["$avgHours", 1] },
              minHours: { $round: ["$minHours", 1] },
              maxHours: { $round: ["$maxHours", 1] },
              count: 1,
            },
          },
        ],
      }).toArray().then((arr) => {
        result.stepBottleneck = arr || [];
      }),
    );
  }

  await Promise.all(tasks);
  return result;
};
