import { type ActFn, type Document, ObjectId } from "lesan";
import { coreApp, inventory, unit } from "../../../mod.ts";
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

  const userUnits =
    (user as unknown as { units?: { _id?: unknown }[] }).units ??
      [];

  const isUnrestricted = user.isGhost ||
    activeRole.name === "Manager" || activeRole.name === "Admin";

  let allowedUnitIds: ObjectId[] | null = isUnrestricted ? null : [];

  if (!isUnrestricted) {
    if (activeRole.name === "Employee") {
      allowedUnitIds = userUnits.map((u) => new ObjectId(String(u._id)));
    } else if (activeRole.name === "UnitHead") {
      allowedUnitIds = activeRole.scopeType === "unit" && activeRole.scopeId
        ? [new ObjectId(activeRole.scopeId)]
        : [];
    } else if (activeRole.name === "OrgHead") {
      if (activeRole.scopeType === "organization" && activeRole.scopeId) {
        const orgUnits = await unit.aggregation({
          pipeline: [
            {
              $match: { "organization._id": new ObjectId(activeRole.scopeId) },
            },
            { $project: { _id: 1 } },
          ],
        }).toArray();
        allowedUnitIds = orgUnits.map((u: Document) => u._id as ObjectId);
      } else {
        allowedUnitIds = [];
      }
    }
  }

  wareId && (match["ware._id"] = new ObjectId(wareId));
  wareModelId && (match["wareModel._id"] = new ObjectId(wareModelId));

  if (unitId) {
    const requestedUnitId = new ObjectId(unitId as string);

    if (
      allowedUnitIds !== null &&
      !allowedUnitIds.some((id) => String(id) === String(requestedUnitId))
    ) {
      throwError("You cant do this");
    }

    match["unit._id"] = requestedUnitId;
  } else if (allowedUnitIds !== null) {
    match["unit._id"] = { $in: allowedUnitIds };
  }

  warehouseUnitId &&
    (match["warehouseUnit._id"] = new ObjectId(warehouseUnitId as string));

  const qty = await inventory.countDocument({ filter: match });

  return { qty };
};
