import { type ActFn, ObjectId } from "lesan";
import { coreApp, tender } from "../../../mod.ts";
import { throwError } from "../../../utils/throwError.ts";
import type { ActiveRole } from "../../../utils/authzPolicy.ts";
import {
  assertCanWritePurchasingRequest,
  loadPurchasingRequestForActor,
} from "../../purchasingRequest/readScope.ts";
import type { MyContext } from "@lib";

export const closeFn: ActFn = async (body) => {
  const {
    set: { _id, activeRoleId },
    get,
  } = body.details;

  const { user }: MyContext = coreApp.contextFns.getContextModel() as MyContext;

  const activeRole = (user.roles || []).find(
    (r: { roleId: string }) => r.roleId === activeRoleId,
  ) as ActiveRole | undefined;

  if (!activeRole) {
    throwError("Active role not found");
    return;
  }

  const tenderDoc = await tender.findOne({
    filters: { _id: new ObjectId(_id as string) },
    projection: { _id: 1, purchasingRequest: { _id: 1 } },
  }) as Record<string, unknown> | null;

  if (!tenderDoc) {
    throwError("Tender not found");
    return;
  }

  const purchasingRequestId = (tenderDoc.purchasingRequest as
    | Record<string, unknown>
    | undefined)?._id;

  if (!purchasingRequestId) {
    throwError("Tender has no linked purchasing request");
    return;
  }

  const pr = await loadPurchasingRequestForActor(
    activeRole,
    user,
    purchasingRequestId,
  );
  assertCanWritePurchasingRequest(activeRole, user, pr);

  return await tender.findOneAndUpdate({
    filter: { _id: new ObjectId(_id as string) },
    update: {
      $set: {
        status: "closed",
        updatedAt: new Date(),
      },
    },
    projection: get,
  });
};
