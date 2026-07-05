import { type ActFn, type Document, ObjectId } from "lesan";
import { tender, tenderOffer, purchasingRequest, purchaseOrderItem, coreApp } from "../../../mod.ts";
import type { MyContext } from "@lib";

export const awardFn: ActFn = async (body) => {
  const { set, get } = body.details;
  const { user }: MyContext = coreApp.contextFns.getContextModel() as MyContext;
  const { activeRoleId, _id, winningOfferId } = set;

  const now = new Date();

  const tenderDoc = await tender.findOne({
    filters: { _id: new ObjectId(_id as string) },
    projection: { _id: 1, status: 1, purchasingRequest: 1, offers: 1 },
  }) as Record<string, unknown>;

  if (!tenderDoc || (tenderDoc.status as string) !== "closed") {
    throw { error: "Tender not found or not closed" };
  }

  const prRef = (tenderDoc.purchasingRequest as Record<string, unknown>)?._id as string;
  if (!prRef) {
    throw { error: "Tender has no linked purchasing request" };
  }

  const winningOffer = await tenderOffer.findOne({
    filters: { _id: new ObjectId(winningOfferId as string) },
    projection: { _id: 1, status: 1, store: 1, price: 1 },
  }) as Record<string, unknown>;

  if (!winningOffer) {
    throw { error: "Winning offer not found" };
  }

  const winningStoreId = (winningOffer.store as Record<string, unknown>)?._id as string;
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

  // Create a single PurchaseOrderItem from the PR's wareModel + quantity
  const poRelations: Record<string, unknown> = {
    purchasingRequest: {
      _ids: new ObjectId(prRef),
      relatedRelations: { purchaseOrderItems: true },
    },
    wareModel: {
      _ids: new ObjectId(wareModelId),
      relatedRelations: { purchaseOrderItems: true },
    },
  };

  if (winningStoreId) {
    poRelations.assignedFrom = {
      _ids: new ObjectId(winningStoreId),
      relatedRelations: { purchaseOrderItems: true },
    };
  }

  poRelations.assignedBy = {
    _ids: user._id,
    relatedRelations: {},
  };

  poRelations.tenderOffer = {
    _ids: new ObjectId(winningOfferId as string),
    relatedRelations: { purchaseOrderItem: true },
  };

  await purchaseOrderItem.insertOne({
    doc: {
      quantity,
      unitPrice: offerPrice,
      totalPrice: offerPrice * quantity,
      status: "assigned",
    },
    relations: poRelations,
    projection: { _id: 1 },
  });

  // Push item_assigned history on the PR
  const activeRole = ((user as Record<string, unknown>).roles as Array<{ roleId: string; name: string; scopeType?: string; scopeId?: string }> || [])
    .find((r) => r.roleId === activeRoleId);

  await purchasingRequest.findOneAndUpdate({
    filter: { _id: new ObjectId(prRef) },
    update: {
      $push: {
        history: {
          action: "item_assigned",
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
            tenderOfferId: winningOfferId,
          },
        },
      },
    },
    projection: { _id: 1 },
  });

  // Auto-populate store on the PR
  if (winningStoreId) {
    await purchasingRequest.addRelation({
      filters: { _id: new ObjectId(prRef) },
      relations: {
        store: {
          _ids: new ObjectId(winningStoreId),
          relatedRelations: { purchasingRequests: true },
        },
      },
      projection: { _id: 1 },
      replace: true,
    });
  }

  // Mark tender as awarded
  return await tender.findOneAndUpdate({
    filter: { _id: new ObjectId(_id as string) },
    update: { $set: { status: "awarded", updatedAt: now } },
    projection: get,
  });
};
