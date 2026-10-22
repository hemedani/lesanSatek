import { type ActFn, type Document, ObjectId } from "lesan";
import { stuff } from "../../../mod.ts";
import { getAuth } from "../../../utils/grantAccess.ts";
import { throwError } from "../../../utils/throwError.ts";
import { loadPurchasingRequestForActor } from "../readScope.ts";

export const checkStoreAvailabilityFn: ActFn = async (body) => {
  const { set: { purchasingRequestId, storeId }, get } = body.details;

  const { user, activeRole } = await getAuth();

  const pr = await loadPurchasingRequestForActor(
    activeRole,
    user,
    purchasingRequestId,
  );

  const prQuantity = (pr.quantity as number) || 0;

  const wareModel = pr.wareModel;
  const wareModelId = wareModel?._id?.toString();
  if (!wareModelId) {
    throwError("Purchasing request has no ware model");
  }

  const match: Record<string, unknown> = { "wareModel._id": new ObjectId(wareModelId) };
  if (storeId) {
    match["store._id"] = new ObjectId(storeId as string);
  }
  match["quantity"] = { $gte: prQuantity };

  const availableStuff = await stuff.aggregation({
    pipeline: [
      { $match: match },
      {
        $lookup: {
          from: "store",
          localField: "store",
          foreignField: "_id",
          as: "storeInfo",
        },
      },
      { $unwind: { path: "$storeInfo", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "ware",
          localField: "ware",
          foreignField: "_id",
          as: "wareInfo",
        },
      },
      { $unwind: { path: "$wareInfo", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          quantity: 1,
          price: 1,
          hasAbsolutePrice: 1,
          pricePercentage: 1,
          expiration: 1,
          barcode: 1,
          "store._id": 1,
          "storeInfo.name": 1,
          "wareInfo.price": 1,
        },
      },
    ],
    projection: get,
  }).toArray();

  const result = availableStuff.map((s: Document) => {
    let effectivePrice: number;
    if (s.hasAbsolutePrice) {
      effectivePrice = s.price as number;
    } else if (s.pricePercentage && s.wareInfo?.price) {
      effectivePrice = (s.wareInfo.price as number) * (1 + (s.pricePercentage as number) / 100);
    } else {
      effectivePrice = s.price as number;
    }

    return {
      stuffId: s._id?.toString(),
      storeId: s.store?._id?.toString(),
      storeName: (s.storeInfo as Record<string, unknown>)?.name as string || "",
      quantity: s.quantity as number,
      price: s.price as number,
      hasAbsolutePrice: s.hasAbsolutePrice as boolean,
      pricePercentage: s.pricePercentage as number | undefined,
      effectivePrice,
      expiration: s.expiration || null,
      barcode: s.barcode || null,
    };
  });

  return {
    wareModel: {
      _id: wareModelId,
      name: wareModel?.name,
      enName: wareModel?.enName,
    },
    requestedQuantity: prQuantity,
    stores: result,
  };
};
