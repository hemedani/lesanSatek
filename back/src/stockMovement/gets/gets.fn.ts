import { type ActFn, type Document, ObjectId } from "lesan";
import { stockMovement, unit, coreApp } from "../../../mod.ts";
import type { MyContext } from "@lib";
import { throwError } from "../../../utils/throwError.ts";

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
      activeRoleId,
    },
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

  const pipeline: Document[] = [];
  const match: Document = {};

  const isWarehouseHead = await (async () => {
    if (activeRole.name !== "UnitHead") return false;
    if (activeRole.scopeType !== "unit" || !activeRole.scopeId) return false;
    const u = await unit.findOne({
      filters: { _id: new ObjectId(activeRole.scopeId) },
      projection: { type: 1 },
    }) as Document | null;
    return u?.type === "Warehouse";
  })();

  if (activeRole.name === "Employee" || activeRole.name === "Ordinary") {
    if (activeRole.scopeType === "unit" && activeRole.scopeId) {
      match["unit._id"] = new ObjectId(activeRole.scopeId);
    }
  } else if (activeRole.name === "UnitHead") {
    if (!isWarehouseHead && activeRole.scopeType === "unit" && activeRole.scopeId) {
      match["unit._id"] = new ObjectId(activeRole.scopeId);
    }
  } else if (activeRole.name === "OrgHead") {
    if (activeRole.scopeType === "organization" && activeRole.scopeId) {
      const orgUnits = await unit.aggregation({
        pipeline: [
          { $match: { "organization._id": new ObjectId(activeRole.scopeId) } },
          { $project: { _id: 1 } },
        ],
      }).toArray();
      if (orgUnits.length > 0) {
        match["unit._id"] = {
          $in: orgUnits.map((u: Document) => u._id),
        };
      }
    }
  }

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
