import { ObjectId } from "lesan";
import { coreApp, unit } from "../mod.ts";
import type { MyContext } from "@lib";
import { throwError } from "./throwError.ts";

export const checkFinanceUnitAccess = async () => {
  const { user }: MyContext = coreApp.contextFns.getContextModel() as MyContext;
  const body = (coreApp.contextFns.getContextModel() as any)?.body;
  const activeRoleId = body?.details?.set?.activeRoleId;

  if (!activeRoleId) {
    throwError("activeRoleId is required");
    return;
  }

  const activeRole = user.roles?.find((r) => r.roleId === activeRoleId);
  if (!activeRole) {
    throwError("Active role not found");
    return;
  }

  if (activeRole.name !== "UnitHead") return;

  if (activeRole.scopeType !== "unit" || !activeRole.scopeId) {
    throwError("Finance unit head must have a unit scope");
    return;
  }

  const unitDoc = await unit.findOne({
    filters: { _id: new ObjectId(activeRole.scopeId) },
    projection: { _id: 1, type: 1 },
  });

  if (!unitDoc || (unitDoc as Record<string, unknown>).type !== "Finance") {
    throwError("Only the head of a Finance unit can manage budgets and payments");
  }
};
