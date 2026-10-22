import { type ActFn, ObjectId } from "lesan";
import { inventory } from "../../../mod.ts";
import { getAuth } from "../../../utils/grantAccess.ts";
import { throwError } from "../../../utils/throwError.ts";
import { assertUnitInActorScope } from "../../../utils/unitScope.ts";

type InventoryDoc = {
  _id?: unknown;
  unit?: { _id?: unknown } | null;
};

export const updateFn: ActFn = async (body) => {
  const {
    set: { _id, activeRoleId: _activeRoleId, ...fields },
    get,
  } = body.details;

  const { user, activeRole } = await getAuth();

  const row = await inventory.findOne({
    filters: { _id: new ObjectId(_id as string) },
    projection: { _id: 1, unit: { _id: 1 } },
  }) as InventoryDoc | null;

  if (!row) {
    throwError("Inventory not found");
    return;
  }

  const unitId = row.unit?._id;
  if (unitId === null || unitId === undefined) {
    throwError("You cant do this");
    return;
  }

  await assertUnitInActorScope(user, activeRole, unitId);

  const updateObj: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined) {
      updateObj[key] = value;
    }
  }

  return await inventory.findOneAndUpdate({
    filter: { _id: new ObjectId(_id as string) },
    update: { $set: updateObj },
    projection: get,
  });
};
