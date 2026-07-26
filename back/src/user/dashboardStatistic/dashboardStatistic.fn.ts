import type { ActFn, Document } from "lesan";
import { ObjectId } from "lesan";
import {
  purchasingRequest,
  stepApproval,
  budgetLine,
  paymentOrder,
  fiscalYear,
  unit,
  coreApp,
} from "../../../mod.ts";
import type { MyContext } from "@lib";
import { throwError } from "../../../utils/throwError.ts";

export const dashboardStatisticFn: ActFn = async (body) => {
  const {
    set: { activeRoleId, unitId: paramUnitId, orgId: paramOrgId },
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

  if (activeRole.name === "UnitHead") {
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
        { $match: { stuffStatus: "delivered" } },
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
      if (effectiveUnitId) {
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
      if (effectiveUnitId) {
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

  await Promise.all(tasks);
  return result;
};
