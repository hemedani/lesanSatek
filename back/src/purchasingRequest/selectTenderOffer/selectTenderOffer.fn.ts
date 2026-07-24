import { type ActFn, ObjectId } from "lesan";
import { purchasingRequest, tenderOffer, tender, coreApp } from "../../../mod.ts";
import type { MyContext } from "@lib";
import { throwError } from "../../../utils/throwError.ts";

export const selectTenderOfferFn: ActFn = async (body) => {
  const { set, get } = body.details;
  const { user }: MyContext = coreApp.contextFns.getContextModel() as MyContext;
  const { activeRoleId, _id, tenderOfferId } = set;

  const activeRole = (user.roles || []).find(
    (r: { roleId: string }) => r.roleId === activeRoleId,
  );
  const now = new Date();
  const prId = new ObjectId(_id as string);

  const pr = await purchasingRequest.findOne({
    filters: { _id: prId },
    projection: {
      _id: 1, status: 1, quantity: 1,
      wareModel: { _id: 1, name: 1, enName: 1 },
    },
  }) as Record<string, unknown>;

  if (!pr) { throwError("Purchasing request not found"); return; }
  if (!["Draft", "Pending", "InProgress"].includes(pr.status as string)) {
    throwError("Can only select a tender offer for a Draft, Pending, or InProgress request");
    return;
  }

  const offerDocs = await tenderOffer.aggregation({
    pipeline: [
      { $match: { _id: new ObjectId(tenderOfferId as string) } },
      { $limit: 1 },
    ],
    projection: {
      _id: 1, status: 1, price: 1, deliveryTime: 1, paymentTerms: 1,
      tender: { _id: 1, title: 1, status: 1 },
      store: { _id: 1, name: 1 },
    },
  }).toArray();

  if (offerDocs.length === 0) { throwError("Tender offer not found"); return; }
  const offer = offerDocs[0] as Record<string, unknown>;

  if (offer.status !== "submitted") {
    throwError("Only submitted offers can be selected");
    return;
  }

  const linkedTender = offer.tender as Record<string, unknown> | undefined;
  if (!linkedTender || !linkedTender._id) {
    throwError("Tender offer has no linked tender");
    return;
  }

  const tenderDocs = await tender.aggregation({
    pipeline: [
      { $match: { _id: linkedTender._id as ObjectId } },
      { $limit: 1 },
    ],
    projection: {
      _id: 1, status: 1, title: 1,
      purchasingRequest: { _id: 1 },
    },
  }).toArray();

  if (tenderDocs.length === 0) { throwError("Linked tender not found"); return; }
  const t = tenderDocs[0] as Record<string, unknown>;

  const tenderPrId = (t.purchasingRequest as Record<string, unknown>)?._id?.toString();
  if (tenderPrId !== _id) {
    throwError("This tender offer does not belong to this purchasing request");
    return;
  }

  const quantity = pr.quantity as number || 0;
  const offerPrice = offer.price as number || 0;
  const estimatedAmount = Math.round(offerPrice * quantity * 100) / 100;

  const offerStore = offer.store as Record<string, unknown> | undefined;
  const prWareModel = pr.wareModel as Record<string, unknown> | undefined;

  await purchasingRequest.findOneAndUpdate({
    filter: { _id: prId },
    update: {
      $set: {
        selectionType: "tender",
        selectedTenderOfferId: tenderOfferId,
        estimatedAmount,
        updatedAt: now,
      },
    },
    projection: { _id: 1 },
  });

  await purchasingRequest.findOneAndUpdate({
    filter: { _id: prId },
    update: {
      $push: {
        history: {
          action: "tender_offer_selected",
          performed: {
            by: user._id.toString(),
            name: `${user.first_name} ${user.last_name}`,
            at: now,
            role: activeRole
              ? {
                id: activeRole.roleId,
                name: activeRole.name,
                scopeType: activeRole.scopeType,
                scopeId: activeRole.scopeId,
              }
              : { id: "", name: "" },
          },
          details: {
            tenderId: linkedTender._id.toString(),
            tenderTitle: t.title,
            tenderOfferId,
            offerPrice,
            offerDeliveryTime: offer.deliveryTime,
            offerPaymentTerms: offer.paymentTerms,
            storeId: offerStore?._id?.toString(),
            storeName: offerStore?.name,
            wareModelId: prWareModel?._id?.toString(),
            wareModelName: prWareModel?.name,
            quantity,
            estimatedAmount,
          },
        },
      },
    },
    projection: { _id: 1 },
  });

  return await purchasingRequest.findOne({ filters: { _id: prId }, projection: get });
};
