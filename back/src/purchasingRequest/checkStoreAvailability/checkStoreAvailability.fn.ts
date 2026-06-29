import { type ActFn, type Document, ObjectId } from "lesan";
import { purchasingRequest, stuff } from "../../../mod.ts";

export const checkStoreAvailabilityFn: ActFn = async (body) => {
  const { set: { purchasingRequestId, storeId }, get } = body.details;

  const pr = await purchasingRequest.findOne({
    filters: { _id: new ObjectId(purchasingRequestId as string) },
    projection: { _id: 1, wareModel: { _id: 1, name: 1, enName: 1 } },
  }) as Record<string, unknown>;

  if (!pr) {
    throw { error: "Purchasing request not found" };
  }

  const wareModel = pr.wareModel as Record<string, unknown> | undefined;
  const wareModelId = wareModel?._id?.toString();
  if (!wareModelId) {
    throw { error: "Purchasing request has no ware model" };
  }

  const match: Record<string, unknown> = { "wareModel._id": new ObjectId(wareModelId) };
  if (storeId) {
    match["store._id"] = new ObjectId(storeId as string);
  }

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
          inventoryNo: 1,
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
      inventoryNo: s.inventoryNo as number,
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
    stores: result,
  };
};
