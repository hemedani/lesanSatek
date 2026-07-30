import type { ActFn, Document } from "lesan";
import { ObjectId } from "lesan";
import { consumption, unit, coreApp } from "../../../mod.ts";
import type { MyContext } from "@lib";
import { throwError } from "../../../utils/throwError.ts";

export const countFn: ActFn = async (body) => {
  const { set: { unitId, wareModelId, reason, consumedFor, activeRoleId } } = body.details;

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
      match["unit.organization._id"] = new ObjectId(activeRole.scopeId);
    }
  }

  unitId && (match["unit._id"] = new ObjectId(unitId as string));
  wareModelId && (match["wareModel._id"] = new ObjectId(wareModelId));
  reason && (match.reason = { $regex: new RegExp(reason as string, "i") });
  consumedFor && (match.consumedFor = { $regex: new RegExp(consumedFor as string, "i") });

  const qty = await consumption.countDocument({ filter: match });

  return { qty };
};
