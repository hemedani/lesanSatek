import { type ActFn, type Document, ObjectId } from "lesan";
import { inventory, unit, coreApp } from "../../../mod.ts";
import type { MyContext } from "@lib";
import { throwError } from "../../../utils/throwError.ts";

export const countFn: ActFn = async (body) => {
  const {
    set: { wareId, wareModelId, unitId, warehouseUnitId, activeRoleId },
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

  wareId && (match["ware._id"] = new ObjectId(wareId));
  wareModelId && (match["wareModel._id"] = new ObjectId(wareModelId));
  unitId && (match["unit._id"] = new ObjectId(unitId as string));
  warehouseUnitId && (match["warehouseUnit._id"] = new ObjectId(warehouseUnitId as string));

  const qty = await inventory.countDocument({ filter: match });

  return { qty };
};
