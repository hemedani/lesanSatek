import { type ActFn, ObjectId } from "lesan";
import { coreApp, tender, tenderOffer } from "../../../mod.ts";
import { throwError } from "../../../utils/throwError.ts";
import type { ActiveRole } from "../../../utils/authzPolicy.ts";
import { isScopeBypass } from "../../../utils/authzPolicy.ts";
import type { MyContext } from "@lib";

export const submitFn: ActFn = async (body) => {
  const { set, get } = body.details;

  const { activeRoleId, tenderId, storeId, wareId, ...rest } = set;

  const { user }: MyContext = coreApp.contextFns.getContextModel() as MyContext;
  const activeRole = (user.roles || []).find(
    (r: { roleId: string }) => r.roleId === activeRoleId,
  ) as ActiveRole | undefined;

  if (!activeRole) {
    throwError("Active role not found");
    return;
  }

  const canUseAnyStore = isScopeBypass(activeRole, user);

  if (!canUseAnyStore) {
    if (activeRole.scopeType !== "store" || !activeRole.scopeId) {
      throwError("You cant do this");
      return;
    }

    if (!storeId) {
      throwError("storeId is required");
      return;
    }

    if (String(storeId) !== String(activeRole.scopeId)) {
      throwError("You cant do this");
      return;
    }
  }

  const tenderDoc = await tender.findOne({
    filters: { _id: new ObjectId(tenderId as string) },
    projection: { _id: 1, status: 1 },
  }) as Record<string, unknown> | null;

  if (!tenderDoc) {
    throwError("Tender not found");
    return;
  }

  if (tenderDoc.status !== "open") {
    throwError("Tender is not open for offers");
    return;
  }

  const relations: Record<string, unknown> = {};

  relations.tender = {
    _ids: new ObjectId(tenderId as string),
    relatedRelations: {
      offers: true,
    },
  };

  if (storeId) {
    relations.store = {
      _ids: new ObjectId(storeId as string),
      relatedRelations: {
        tenderOffers: true,
      },
    };
  }

  if (wareId) {
    relations.ware = {
      _ids: new ObjectId(wareId as string),
      relatedRelations: {
        tenderOffers: true,
      },
    };
  }

  return await tenderOffer.insertOne({
    doc: {
      ...rest,
      status: rest.status || "submitted",
      submittedAt: new Date(rest.submittedAt as string || new Date()),
    },
    relations,
    projection: get,
  });
};
