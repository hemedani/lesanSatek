import { type ActFn, type Document, ObjectId } from "lesan";
import { coreApp, tenderOffer } from "../../../mod.ts";
import { throwError } from "../../../utils/throwError.ts";
import type { MyContext } from "@lib";

export const getFn: ActFn = async (body) => {
  const {
    set: { _id, activeRoleId },
    get,
  } = body.details;

  const { user }: MyContext = coreApp.contextFns.getContextModel() as MyContext;

  const activeRole = (user.roles || []).find(
    (r: { roleId: string }) => r.roleId === activeRoleId,
  ) as { name: string; scopeType?: string; scopeId?: string } | undefined;

  if (!activeRole) {
    throwError("Active role not found");
    return [];
  }

  const match: Document = { _id: new ObjectId(_id as string) };

  if (activeRole.name === "StoreHead") {
    if (activeRole.scopeType !== "store" || !activeRole.scopeId) {
      throwError("You cant do this");
      return [];
    }

    match["store._id"] = new ObjectId(activeRole.scopeId);
  }

  return await tenderOffer
    .aggregation({
      pipeline: [{ $match: match }],
      projection: get,
    })
    .toArray();
};
