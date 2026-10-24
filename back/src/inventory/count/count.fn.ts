import { type ActFn, type Document, ObjectId } from "lesan";
import { inventory } from "../../../mod.ts";
import { getAuth } from "../../../utils/grantAccess.ts";
import {
  idMatch,
  intersectObjectIds,
  inventoryAllowedUnitIds,
} from "../readScope.ts";

export const countFn: ActFn = async (body) => {
  const {
    set: { wareId, wareModelId, unitId, warehouseUnitId },
  } = body.details;

  const { user, activeRole } = await getAuth();
  const allowedUnitIds = await inventoryAllowedUnitIds(activeRole, user);

  const match: Document = {};

  let effectiveUnitIds = allowedUnitIds;

  if (unitId) {
    effectiveUnitIds = intersectObjectIds(allowedUnitIds, [
      new ObjectId(unitId as string),
    ]);
  }

  wareId && (match["ware._id"] = new ObjectId(wareId));
  wareModelId && (match["wareModel._id"] = new ObjectId(wareModelId));

  if (effectiveUnitIds !== null) {
    match["unit._id"] = idMatch(effectiveUnitIds);
  }

  warehouseUnitId &&
    (match["warehouseUnit._id"] = new ObjectId(warehouseUnitId as string));

  const qty = await inventory.countDocument({ filter: match });

  return { qty };
};
