import { type ActFn, ObjectId } from "lesan";
import {
  coreApp,
  purchasingRequest,
  stuff,
  tender,
  tenderOffer,
} from "../../../mod.ts";
import { throwError } from "../../../utils/throwError.ts";
import type { ActiveRole } from "../../../utils/authzPolicy.ts";
import {
  assertCanWritePurchasingRequest,
  loadPurchasingRequestForActor,
} from "../../purchasingRequest/readScope.ts";
import type { MyContext } from "@lib";

export const awardFn: ActFn = async (body) => {
  const { set, get } = body.details;
  const { user }: MyContext = coreApp.contextFns.getContextModel() as MyContext;
  const { activeRoleId, _id, winningOfferId } = set;

  const activeRole = ((user as Record<string, unknown>).roles as ActiveRole[] || [])
    .find((r) => r.roleId === activeRoleId);

  if (!activeRole) {
    throwError("Active role not found");
    return;
  }

  const now = new Date();

  const tenderDoc = await tender.findOne({
    filters: { _id: new ObjectId(_id as string) },
    projection: { _id: 1, status: 1, purchasingRequest: 1, offers: 1 },
  }) as Record<string, unknown>;

  if (!tenderDoc || (tenderDoc.status as string) !== "closed") {
    throw new Error("Tender not found or not closed");
  }

  const prRef = (tenderDoc.purchasingRequest as Record<string, unknown>)?._id as string;
  if (!prRef) {
    throwError("Tender has no linked purchasing request");
    return;
  }

  const prAccess = await loadPurchasingRequestForActor(
    activeRole,
    user,
    prRef,
  );
  assertCanWritePurchasingRequest(activeRole, user, prAccess);

  const winningOffer = await tenderOffer.findOne({
    filters: { _id: new ObjectId(winningOfferId as string) },
    projection: { _id: 1, status: 1, tender: { _id: 1 }, store: { _id: 1 }, price: 1 },
  }) as Record<string, unknown> | null;

  if (!winningOffer) {
    throwError("Winning offer not found");
    return;
  }

  const offerTenderId = (winningOffer.tender as Record<string, unknown>)?._id;
  if (String(offerTenderId ?? "") !== String(_id)) {
    throwError("Winning offer does not belong to this tender");
    return;
  }

  const winningStoreId = (winningOffer.store as Record<string, unknown>)?._id as string;
  if (!winningStoreId) {
    throwError("Winning offer has no store");
    return;
  }

  const offerPrice = (winningOffer.price as number) || 0;

  // Accept winning offer
  await tenderOffer.findOneAndUpdate({
    filter: { _id: new ObjectId(winningOfferId as string) },
    update: { $set: { status: "accepted", updatedAt: now } },
    projection: { _id: 1 },
  });

  // Reject all other offers on this tender
  const offers = await tenderOffer.aggregation({
    pipeline: [
      { $match: { "tender._id": new ObjectId(_id as string), _id: { $ne: new ObjectId(winningOfferId as string) } } },
    ],
    projection: { _id: 1 },
  }).toArray();

  for (const offer of offers) {
    await tenderOffer.findOneAndUpdate({
      filter: { _id: offer._id as ObjectId },
      update: { $set: { status: "rejected", updatedAt: now } },
      projection: { _id: 1 },
    });
  }

  // Load the PR to get its wareModel + quantity
  const pr = await purchasingRequest.findOne({
    filters: { _id: new ObjectId(prRef) },
    projection: {
      _id: 1,
      quantity: 1,
      wareModel: { _id: 1, name: 1, enName: 1 },
    },
  }) as Record<string, unknown>;

  const wareModel = pr?.wareModel as Record<string, unknown> | undefined;
  const wareModelId = wareModel?._id?.toString() || "";
  const wareModelName = (wareModel?.name as string) || "";
  const quantity = (pr?.quantity as number) || 0;

  const estimatedAmount = Math.round(offerPrice * quantity * 100) / 100;

  // Find the Stuff matching the winning store + PR's wareModel
  const stuffDoc = await stuff.aggregation({
    pipeline: [
      {
        $match: {
          "store._id": new ObjectId(winningStoreId),
          "wareModel._id": new ObjectId(wareModelId),
        },
      },
      { $limit: 1 },
    ],
    projection: { _id: 1 },
  }).toArray();

  const stuffId = stuffDoc.length > 0 ? (stuffDoc[0]._id as ObjectId).toString() : undefined;

  // Set PR fields directly instead of creating a separate order item
  await purchasingRequest.findOneAndUpdate({
    filter: { _id: new ObjectId(prRef) },
    update: {
      $set: {
        stuffStatus: "assigned",
        estimatedAmount,
        updatedAt: now,
      },
    },
    projection: { _id: 1 },
  });

  // Link stuff + store on the PR
  const prRelations: Record<string, unknown> = {};
  if (stuffId) {
    prRelations.stuff = {
      _ids: new ObjectId(stuffId),
      relatedRelations: { purchasingRequests: true },
    };
  }
  if (winningStoreId) {
    prRelations.store = {
      _ids: new ObjectId(winningStoreId),
      relatedRelations: { purchasingRequests: true },
    };
  }
  if (Object.keys(prRelations).length > 0) {
    await purchasingRequest.addRelation({
      filters: { _id: new ObjectId(prRef) },
      relations: prRelations,
      projection: { _id: 1 },
      replace: true,
    });
  }

  await purchasingRequest.findOneAndUpdate({
    filter: { _id: new ObjectId(prRef) },
    update: {
      $push: {
        history: {
          action: "stuff_assigned",
          performed: {
            by: user._id.toString(),
            name: `${(user as Record<string, unknown>).first_name} ${(user as Record<string, unknown>).last_name}`,
            at: now,
            role: activeRole ? {
              id: activeRole.roleId,
              name: activeRole.name,
              scopeType: activeRole.scopeType,
              scopeId: activeRole.scopeId,
            } : { id: "", name: "" },
          },
          details: {
            wareModelId,
            wareModelName,
            quantity,
            unitPrice: offerPrice,
            storeId: winningStoreId,
            stuffId,
            tenderOfferId: winningOfferId,
          },
        },
      },
    },
    projection: { _id: 1 },
  });

  // Mark tender as awarded
  return await tender.findOneAndUpdate({
    filter: { _id: new ObjectId(_id as string) },
    update: { $set: { status: "awarded", updatedAt: now } },
    projection: get,
  });
};
