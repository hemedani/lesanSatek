import { type ActFn, ObjectId } from "lesan";
import {
  purchasingRequest,
  tender,
  tenderOffer,
  stuff,
  budgetLine,
  coreApp,
} from "../../../mod.ts";
import type { MyContext } from "@lib";
import { throwError } from "../../../utils/throwError.ts";

export const finalizeFn: ActFn = async (body) => {
  const { set, get } = body.details;
  const { user }: MyContext = coreApp.contextFns
    .getContextModel() as MyContext;

  const { activeRoleId, _id, finalWinner, budgetLineId, postCompletionSteps } = set;

  const activeRole = (user.roles || []).find(
    (r: { roleId: string }) => r.roleId === activeRoleId,
  );

  const now = new Date();
  const prId = new ObjectId(_id as string);

  const reqs = await purchasingRequest.aggregation({
    pipeline: [{ $match: { _id: prId } }],
    projection: {
      _id: 1,
      status: 1,
      quantity: 1,
      selectionType: 1,
      selectedTenderOfferId: 1,
      stuffStatus: 1,
      stuff: { _id: 1 },
      store: { _id: 1 },
      estimatedAmount: 1,
      wareModel: { _id: 1, name: 1, enName: 1 },
      process: { _id: 1 },
    },
  }).toArray();

  if (reqs.length === 0) throwError("Purchasing request not found");
  const req = reqs[0] as Record<string, unknown>;

  if (req.status !== "PendingFinalization") {
    throwError("Only requests in PendingFinalization status can be finalized");
    return;
  }

  const prStuff = req.stuff as Record<string, unknown> | undefined;
  const prTenderOfferId = req.selectedTenderOfferId as string | undefined;
  const prQuantity = (req.quantity as number) || 0;
  const prWareModel = req.wareModel as Record<string, unknown> | undefined;
  const wareModelId = prWareModel?._id?.toString();

  const hasStuff = !!(prStuff?._id);
  const hasTenderOffer = !!prTenderOfferId;

  let resolvedFinalWinner = finalWinner as string | undefined;

  if (hasStuff && hasTenderOffer) {
    if (!resolvedFinalWinner) {
      throwError(
        "This request has both a stuff assignment and a tender offer. Please specify the final winner via finalWinner: 'stuff' or 'tender'.",
      );
      return;
    }
  } else if (hasStuff) {
    resolvedFinalWinner = "stuff";
  } else if (hasTenderOffer) {
    resolvedFinalWinner = "tender";
  } else {
    throwError(
      "This request has no stuff assignment or tender offer. Cannot finalize.",
    );
    return;
  }

  let winningStoreId: string | undefined;
  let finalStuffId: string | undefined;
  let tenderAwardDetails: Record<string, unknown> | undefined;

  if (resolvedFinalWinner === "tender" && prTenderOfferId) {
    const awardOfferDocs = await tenderOffer.aggregation({
      pipeline: [
        { $match: { _id: new ObjectId(prTenderOfferId) } },
        { $limit: 1 },
      ],
      projection: {
        _id: 1, price: 1,
        store: { _id: 1, name: 1 },
        tender: { _id: 1, title: 1, status: 1 },
      },
    }).toArray();

    if (awardOfferDocs.length === 0) {
      throwError("Selected tender offer not found");
      return;
    }

    const winningOffer = awardOfferDocs[0] as Record<string, unknown>;
    const tenderRef = winningOffer.tender as Record<string, unknown> | undefined;
    const tenderId = tenderRef?._id as ObjectId;
    winningStoreId = (winningOffer.store as Record<string, unknown>)?._id?.toString();
    const offerPrice = (winningOffer.price as number) || 0;

    await tender.findOneAndUpdate({
      filter: { _id: tenderId },
      update: { $set: { status: "awarded", updatedAt: now } },
      projection: { _id: 1 },
    });

    await tenderOffer.findOneAndUpdate({
      filter: { _id: new ObjectId(prTenderOfferId) },
      update: { $set: { status: "accepted", updatedAt: now } },
      projection: { _id: 1 },
    });

    const otherOffers = await tenderOffer.aggregation({
      pipeline: [
        {
          $match: {
            "tender._id": tenderId,
            _id: { $ne: new ObjectId(prTenderOfferId) },
          },
        },
      ],
      projection: { _id: 1 },
    }).toArray();

    for (const o of otherOffers) {
      await tenderOffer.findOneAndUpdate({
        filter: { _id: o._id as ObjectId },
        update: { $set: { status: "rejected", updatedAt: now } },
        projection: { _id: 1 },
      });
    }

    if (winningStoreId && wareModelId) {
      const stuffDocs = await stuff.aggregation({
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
      if (stuffDocs.length > 0) {
        finalStuffId = stuffDocs[0]._id.toString();
      }
    }

    const awardEstimatedAmount = Math.round(offerPrice * prQuantity * 100) / 100;

    const prRel: Record<string, unknown> = {};
    if (finalStuffId) {
      prRel.stuff = {
        _ids: new ObjectId(finalStuffId),
        relatedRelations: { purchasingRequests: true },
      };
    }
    if (winningStoreId) {
      prRel.store = {
        _ids: new ObjectId(winningStoreId),
        relatedRelations: { purchasingRequests: true },
      };
    }
    if (Object.keys(prRel).length > 0) {
      await purchasingRequest.addRelation({
        filters: { _id: prId },
        relations: prRel,
        projection: { _id: 1 },
        replace: true,
      });
    }

    await purchasingRequest.findOneAndUpdate({
      filter: { _id: prId },
      update: {
        $set: {
          stuffStatus: "assigned",
          estimatedAmount: awardEstimatedAmount,
          updatedAt: now,
        },
      },
      projection: { _id: 1 },
    });

    tenderAwardDetails = {
      tenderId: tenderId.toString(),
      tenderOfferId: prTenderOfferId,
      offerPrice,
      storeId: winningStoreId,
      stuffId: finalStuffId,
      wareModelId,
      quantity: prQuantity,
      estimatedAmount: awardEstimatedAmount,
    };
  }

  if (resolvedFinalWinner === "stuff" && hasTenderOffer) {
    const canceledTenders = await tender.aggregation({
      pipeline: [{ $match: { "purchasingRequest._id": prId } }],
      projection: { _id: 1, status: 1, title: 1 },
    }).toArray();

    for (const t of canceledTenders) {
      const tenderStatus = t.status as string;
      if (tenderStatus === "open" || tenderStatus === "closed") {
        await tender.findOneAndUpdate({
          filter: { _id: t._id as ObjectId },
          update: { $set: { status: "cancelled", updatedAt: now } },
          projection: { _id: 1 },
        });

        const tenderOffers = await tenderOffer.aggregation({
          pipeline: [{ $match: { "tender._id": t._id as ObjectId } }],
          projection: { _id: 1, status: 1 },
        }).toArray();

        for (const o of tenderOffers) {
          if ((o.status as string) === "submitted") {
            await tenderOffer.findOneAndUpdate({
              filter: { _id: o._id as ObjectId },
              update: { $set: { status: "rejected", updatedAt: now } },
              projection: { _id: 1 },
            });
          }
        }
      }
    }

    const prExistingStore = req.store as Record<string, unknown> | undefined;
    winningStoreId = prExistingStore?._id?.toString();
  }

  const postSteps = postCompletionSteps
    ? (postCompletionSteps as Array<Record<string, unknown>>).map((step) => ({
      name: step.name as string,
      description: (step.description as string) || "",
      unitId: step.unitId as string,
      comment: (step.comment as string) || "",
      status: "pending",
    }))
    : undefined;

  const updateData: Record<string, unknown> = {
    status: "Completed",
    completedAt: now,
    finalizedAt: now,
    updatedAt: now,
  };

  if (postSteps) {
    updateData.postCompletionSteps = postSteps;
  }

  // Budget line override by OrgHead
  let finalBudgetLineDoc: Record<string, unknown> | undefined;
  if (budgetLineId) {
    const blDocs = await budgetLine.aggregation({
      pipeline: [{ $match: { _id: new ObjectId(budgetLineId as string) } }],
      projection: { _id: 1, code: 1, title: 1, remainingBudget: 1 },
    }).toArray();

    if (blDocs.length === 0) {
      throwError("Budget line not found");
    }

    const bl = blDocs[0];
    const estimatedAmount = (req.estimatedAmount as number) || 0;
    const remainingBudget = (bl.remainingBudget as number) || 0;

    if (remainingBudget < estimatedAmount) {
      throwError(
        `Insufficient budget: remaining (${remainingBudget}) is less than required (${estimatedAmount})`,
      );
    }

    await purchasingRequest.addRelation({
      filters: { _id: prId },
      relations: {
        budgetLine: {
          _ids: new ObjectId(budgetLineId as string),
          relatedRelations: { purchasingRequests: true },
        },
      },
      projection: { _id: 1 },
      replace: true,
    });

    finalBudgetLineDoc = {
      _id: bl._id.toString(),
      code: bl.code as string,
      title: bl.title as string,
    };
  }

  const historyPush: Record<string, unknown> = {
    action: "finalized",
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
      finalWinner: resolvedFinalWinner,
      winningStoreId,
      ...(tenderAwardDetails || {}),
      ...(finalBudgetLineDoc ? { budgetLine: finalBudgetLineDoc } : {}),
    },
  };

  if (postSteps) {
    (historyPush.details as Record<string, unknown>).postCompletionSteps =
      postSteps;
  }

  await purchasingRequest.findOneAndUpdate({
    filter: { _id: prId },
    update: {
      $set: updateData,
      $push: { history: historyPush },
    },
    projection: { _id: 1 },
  });

  return await purchasingRequest.findOne({
    filters: { _id: prId },
    projection: get,
  });
};
