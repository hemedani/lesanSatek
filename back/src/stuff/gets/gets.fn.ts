import type { ActFn, Document } from "lesan";
import { ObjectId } from "lesan";
import { stuff, coreApp } from "../../../mod.ts";
import type { MyContext } from "@lib";

const monthFieldMap: Record<string, string> = {
  two: "twoMonthPricePercent",
  three: "threeMonthPricePercent",
  four: "fourMonthPricePercent",
  five: "fiveMonthPricePercent",
  six: "sixMonthPricePercent",
  seven: "sevenMonthPricePercent",
  eight: "eightMonthPricePercent",
  nine: "nineMonthPricePercent",
  ten: "tenMonthPricePercent",
  eleven: "elevenMonthPricePercent",
  twelve: "twelveMonthPricePercent",
  eighteen: "eighteenMonthPricePercent",
  twentyFour: "twentyFourMonthPricePercent",
};

export const getsFn: ActFn = async (body) => {
  const {
    set: {
      page, limit, skip, search, sortBy, sortOrder, activeRoleId,
      wareModelId, wareId, storeId, wareTypeId, wareClassId, wareGroupId,
      priceMin, priceMax, quantityMin,
      hasAbsolutePrice, hasLongPayment, availableLongPayment, minLongPaymentMonth,
      expirationBefore, expirationAfter, isExpirationNear,
      barcode,
    },
    get,
  } = body.details;

  const { user }: MyContext = coreApp.contextFns.getContextModel() as MyContext;

  const pipeline: Document[] = [];

  const activeRole = (user.roles || []).find(
    (r: { roleId: string }) => r.roleId === activeRoleId,
  ) as { name: string; scopeType?: string; scopeId?: string } | undefined;

  const matchStage: Document = {};

  if (activeRole?.name === "StoreHead") {
    if (activeRole.scopeType === "store" && activeRole.scopeId) {
      matchStage["store._id"] = new ObjectId(activeRole.scopeId);
    }
  }

  if (wareModelId) matchStage["wareModel._id"] = new ObjectId(wareModelId);
  if (wareId) matchStage["ware._id"] = new ObjectId(wareId);
  if (storeId) matchStage["store._id"] = new ObjectId(storeId);
  if (wareTypeId) matchStage["wareType._id"] = new ObjectId(wareTypeId);
  if (wareClassId) matchStage["wareClass._id"] = new ObjectId(wareClassId);
  if (wareGroupId) matchStage["wareGroup._id"] = new ObjectId(wareGroupId);

  if (barcode) matchStage.barcode = barcode;

  if (hasAbsolutePrice !== undefined) matchStage.hasAbsolutePrice = hasAbsolutePrice;
  if (isExpirationNear !== undefined) matchStage.isExpirationNear = isExpirationNear;
  if (availableLongPayment) matchStage.availableLongPayment = { $regex: availableLongPayment, $options: "i" };

  if (hasLongPayment) {
    const orClauses = Object.values(monthFieldMap).map((field) => ({
      [field]: { $exists: true, $ne: null },
    }));
    matchStage.$or = orClauses;
  }

  if (minLongPaymentMonth) {
    const field = monthFieldMap[minLongPaymentMonth];
    if (field) {
      matchStage[field] = { $exists: true, $ne: null };
    }
  }

  if (Object.keys(matchStage).length > 0) {
    pipeline.push({ $match: matchStage });
  }

  const rangeMatch: Document = {};
  if (priceMin !== undefined || priceMax !== undefined) {
    rangeMatch.price = {};
    if (priceMin !== undefined) rangeMatch.price.$gte = Number(priceMin);
    if (priceMax !== undefined) rangeMatch.price.$lte = Number(priceMax);
  }
  if (quantityMin !== undefined) {
    rangeMatch.quantity = { $gte: Number(quantityMin) };
  }
  if (expirationBefore !== undefined || expirationAfter !== undefined) {
    rangeMatch.expiration = {};
    if (expirationBefore !== undefined) rangeMatch.expiration.$lte = new Date(expirationBefore as string);
    if (expirationAfter !== undefined) rangeMatch.expiration.$gte = new Date(expirationAfter as string);
  }
  if (Object.keys(rangeMatch).length > 0) {
    pipeline.push({ $match: rangeMatch });
  }

  if (search) {
    pipeline.push({ $match: { $text: { $search: search } } });
  }

  if (search && (!sortBy || sortBy === "relevance")) {
    pipeline.push({ $addFields: { textScore: { $meta: "textScore" } } });
  }

  const sortField = sortBy === "relevance" ? "textScore" : (sortBy || "_id");
  const sortDirection = sortOrder === "asc" ? 1 : -1;
  pipeline.push({ $sort: { [sortField]: sortDirection } });

  const calculatedSkip = skip ?? (limit || 50) * ((page || 1) - 1);
  pipeline.push({ $skip: calculatedSkip });
  pipeline.push({ $limit: limit || 50 });

  return await stuff
    .aggregation({ pipeline, projection: get })
    .toArray();
};
