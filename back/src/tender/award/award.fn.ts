import { type ActFn, type Document, ObjectId } from "lesan";
import { tender, tenderOffer, purchasingRequest, purchaseOrderItem, coreApp } from "../../../mod.ts";
import type { MyContext } from "@lib";

export const awardFn: ActFn = async (body) => {
  const { set, get } = body.details;
  const { user }: MyContext = coreApp.contextFns.getContextModel() as MyContext;
  const { _id, winningOfferId } = set;

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
    projection: { _id: 1, status: 1, store: 1 },
  }) as Record<string, unknown>;

  if (!winningOffer) {
    throw { error: "Winning offer not found" };
  }

  const winningStoreId = (winningOffer.store as Record<string, unknown>)?._id as string;

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

  // Load the PR to get its items
  const pr = await purchasingRequest.findOne({
    filters: { _id: new ObjectId(prRef) },
    projection: { _id: 1, items: 1 },
  }) as Record<string, unknown>;

  const prItems = (pr?.items as Array<Record<string, unknown>>) || [];

  // Create purchaseOrderItems from PR items
  for (const item of prItems) {
    const poRelations: Record<string, unknown> = {
      purchasingRequest: {
        _ids: new ObjectId(prRef),
        relatedRelations: { purchaseOrderItems: true },
      },
    };

    if (winningStoreId) {
      poRelations.assignedFrom = {
        _ids: new ObjectId(winningStoreId),
        relatedRelations: {},
      };
    }

    poRelations.assignedBy = {
      _ids: user._id,
      relatedRelations: {},
    };

    await purchaseOrderItem.insertOne({
      doc: {
        wareModelId: item.wareModelId as string,
        wareModelName: item.wareModelName as string,
        wareId: item.wareId as string | undefined,
        wareName: item.wareName as string | undefined,
        quantity: item.quantity as number,
        unitPrice: item.unitPrice as number | undefined,
        status: "assigned",
      },
      relations: poRelations,
      projection: { _id: 1 },
    });
  }

  // Push item_assigned history on the PR
  const historyEntries = prItems.map((item) => ({
    action: "item_assigned",
    performedBy: user._id.toString(),
    performedByName: `${(user as Record<string, unknown>).first_name} ${(user as Record<string, unknown>).last_name}`,
    performedAt: now,
    details: {
      wareModelId: item.wareModelId,
      wareModelName: item.wareModelName,
      quantity: item.quantity,
      storeId: winningStoreId,
      itemCount: prItems.length,
      totalItems: prItems.length,
    },
  }));

  if (historyEntries.length > 0) {
    // Push first entry with full details, remaining as simplified entries
    const firstEntry = historyEntries[0];
    firstEntry.details.itemCount = prItems.length;
    await purchasingRequest.findOneAndUpdate({
      filter: { _id: new ObjectId(prRef) },
      update: { $push: { history: firstEntry } },
      projection: { _id: 1 },
    });
  }

  // Mark tender as awarded
  return await tender.findOneAndUpdate({
    filter: { _id: new ObjectId(_id as string) },
    update: { $set: { status: "awarded", updatedAt: now } },
    projection: get,
  });
};
