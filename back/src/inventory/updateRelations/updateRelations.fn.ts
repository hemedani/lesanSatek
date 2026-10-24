import { type ActFn, ObjectId } from "lesan";
import { inventory } from "../../../mod.ts";
import { getAuth } from "../../../utils/grantAccess.ts";
import { throwError } from "../../../utils/throwError.ts";
import { assertUnitInActorScope } from "../../../utils/unitScope.ts";

type InventoryDoc = {
  _id?: unknown;
  unit?: { _id?: unknown } | null;
};

export const updateRelationsFn: ActFn = async (body) => {
  const {
    set: { _id, unitId, warehouseUnitId },
    get,
  } = body.details;

  const { user, activeRole } = await getAuth();
  const inventoryId = new ObjectId(_id);

  const row = await inventory.findOne({
    filters: { _id: inventoryId },
    projection: { _id: 1, unit: { _id: 1 } },
  }) as InventoryDoc | null;

  if (!row) {
    throwError("Inventory not found");
    return;
  }

  const currentUnitId = row.unit?._id;
  if (currentUnitId === null || currentUnitId === undefined) {
    throwError("You cant do this");
    return;
  }

  await assertUnitInActorScope(user, activeRole, currentUnitId);

  if (unitId !== undefined) {
    await assertUnitInActorScope(user, activeRole, unitId);
  }

  if (warehouseUnitId !== undefined) {
    await assertUnitInActorScope(user, activeRole, warehouseUnitId);
  }

  if (unitId !== undefined) {
    await inventory.addRelation({
      filters: { _id: inventoryId },
      relations: {
        unit: {
          _ids: new ObjectId(unitId as string),
          relatedRelations: {
            inventories: true,
          },
        },
      },
      projection: get,
      replace: true,
    });
  }

  if (warehouseUnitId !== undefined) {
    await inventory.addRelation({
      filters: { _id: inventoryId },
      relations: {
        warehouseUnit: {
          _ids: new ObjectId(warehouseUnitId as string),
          relatedRelations: {
            warehouseInventories: true,
          },
        },
      },
      projection: get,
      replace: true,
    });
  }

  return await inventory.findOne({
    filters: { _id: inventoryId },
    projection: get,
  });
};
