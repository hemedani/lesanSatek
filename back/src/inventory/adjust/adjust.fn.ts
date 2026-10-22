import { type ActFn, type Document, ObjectId } from "lesan";
import { coreApp, inventory } from "../../../mod.ts";
import type { MyContext } from "@lib";
import { assertWareModelAccess } from "../../../utils/checkWareModelAccess.ts";
import type { ActiveRole } from "../../../utils/authzPolicy.ts";
import { isManagerLike } from "../../../utils/authzPolicy.ts";
import { throwError } from "../../../utils/throwError.ts";
import { assertUnitInActorScope } from "../../../utils/unitScope.ts";

export const adjustFn: ActFn = async (body) => {
  const {
    set: { _id, quantity, activeRoleId },
    get,
  } = body.details;

  const { user }: MyContext = coreApp.contextFns.getContextModel() as MyContext;

  const activeRole = (user.roles || []).find(
    (r: { roleId: string }) => r.roleId === activeRoleId,
  ) as ActiveRole | undefined;

  const isUnrestricted = Boolean(user.isGhost) ||
    (activeRole !== undefined && isManagerLike(activeRole));

  if (!isUnrestricted) {
    if (!activeRole) {
      throwError("Active role not found");
      return;
    }

    const inventoryId = new ObjectId(_id as string);

    const inv = await inventory.findOne({
      filters: { _id: inventoryId },
      projection: {
        unit: { _id: 1 },
        wareModel: { _id: 1 },
        wareType: { _id: 1 },
        wareClass: { _id: 1 },
        wareGroup: { _id: 1 },
      },
    }) as Document | null;

    if (!inv) {
      throwError("Inventory not found");
      return;
    }

    const unitRelation = inv.unit as { _id?: unknown } | null | undefined;
    const unitId = unitRelation?._id;

    if (unitId === null || unitId === undefined) {
      throwError("You cant do this");
      return;
    }

    await assertUnitInActorScope(user, activeRole, unitId);

    await assertWareModelAccess(user, activeRole, {
      _id: (inv.wareModel as Record<string, unknown>)?._id,
      wareType: inv.wareType as { _id?: unknown },
      wareClass: inv.wareClass as { _id?: unknown },
      wareGroup: inv.wareGroup as { _id?: unknown },
    });
  }

  return await inventory.findOneAndUpdate({
    filter: { _id: new ObjectId(_id as string) },
    update: {
      $set: {
        quantity,
        updatedAt: new Date(),
      },
    },
    projection: get,
  });
};
