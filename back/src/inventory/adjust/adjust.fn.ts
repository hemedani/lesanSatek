import { type ActFn, type Document, ObjectId } from "lesan";
import { inventory, coreApp } from "../../../mod.ts";
import type { MyContext } from "@lib";
import { throwError } from "../../../utils/throwError.ts";

export const adjustFn: ActFn = async (body) => {
  const {
    set: { _id, quantity, description, activeRoleId },
    get,
  } = body.details;

  const { user }: MyContext = coreApp.contextFns.getContextModel() as MyContext;

  const activeRole = (user.roles || []).find(
    (r: { roleId: string }) => r.roleId === activeRoleId,
  ) as { name: string; scopeType?: string; scopeId?: string } | undefined;

  if (!user.isGhost && activeRole && !["Manager", "Admin"].includes(activeRole.name)) {
    const inv = await inventory.findOne({
      filters: { _id: new ObjectId(_id as string) },
      projection: { unit: { _id: 1 } },
    }) as Document | null;

    if (!inv) {
      throwError("Inventory not found");
      return;
    }

    if (activeRole.scopeType === "unit" && activeRole.scopeId) {
      if (activeRole.scopeId.toString() !== inv.unit._id.toString()) {
        throwError("You can only adjust inventory in your own unit");
        return;
      }
    } else {
      throwError("Your active role does not have an associated unit");
      return;
    }
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
