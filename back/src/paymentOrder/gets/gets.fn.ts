import { type ActFn, type Document, ObjectId } from "lesan";
import { paymentOrder, unit, coreApp } from "../../../mod.ts";
import type { MyContext } from "@lib";

export const getsFn: ActFn = async (body) => {
  const { user }: MyContext = coreApp.contextFns.getContextModel() as MyContext;

  const {
    set: {
      page,
      limit,
      skip,
      sortBy,
      sortOrder,
      purchasingRequestId,
      status,
      financialUnitId,
      activeRoleId,
    },
    get,
  } = body.details;

  const activeRole = (user.roles || []).find(
    (r: { roleId: string }) => r.roleId === activeRoleId,
  ) as { name: string; scopeType?: string; scopeId?: string } | undefined;

  const pipeline: Document[] = [];

  const match: Document = {};
  purchasingRequestId && (match["purchasingRequest._id"] = new ObjectId(purchasingRequestId as string));
  status && (match.status = status);
  financialUnitId && (match["financialUnit._id"] = new ObjectId(financialUnitId as string));

  if (activeRole?.name === "OrgHead" && activeRole.scopeType === "organization" && activeRole.scopeId) {
    // OrgHead sees all payment orders in their org — no financialUnit filter needed
  } else if (activeRole?.name === "UnitHead" && activeRole.scopeType === "unit" && activeRole.scopeId) {
    const unitDoc = await unit.findOne({
      filters: { _id: new ObjectId(activeRole.scopeId as string) },
      projection: { type: 1 },
    });
    if (unitDoc && (unitDoc as Record<string, unknown>).type !== "Finance") {
      match["financialUnit._id"] = new ObjectId(activeRole.scopeId as string);
    }
  }

  if (Object.keys(match).length > 0) {
    pipeline.push({ $match: match });
  }

  const sortField = sortBy || "_id";
  const sortDirection = sortOrder === "asc" ? 1 : -1;
  pipeline.push({ $sort: { [sortField]: sortDirection } });

  const calculatedSkip = skip ?? (limit || 50) * ((page || 1) - 1);
  pipeline.push({ $skip: calculatedSkip });
  pipeline.push({ $limit: limit || 50 });

  return await paymentOrder
    .aggregation({
      pipeline,
      projection: get,
    })
    .toArray();
};
