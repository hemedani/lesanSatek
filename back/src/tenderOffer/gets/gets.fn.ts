import { type ActFn, type Document, ObjectId } from "lesan";
import { tenderOffer } from "../../../mod.ts";
import { getAuth } from "../../../utils/grantAccess.ts";
import { throwError } from "../../../utils/throwError.ts";
import { tenderOfferReadMatch } from "../readScope.ts";

export const getsFn: ActFn = async (body) => {
  const {
    set: {
      page, limit, skip, search, sortBy, sortOrder,
      tenderId, storeId, wareId, status,
      priceMin, priceMax, deliveryTimeMin, deliveryTimeMax,
      paymentTerms, submittedAtBefore, submittedAtAfter,
    },
    get,
  } = body.details;

  const { user, activeRole } = await getAuth();

  const pipeline: Document[] = [];

  const readMatch = tenderOfferReadMatch(activeRole, user);
  readMatch && pipeline.push({ $match: readMatch });

  const matchStage: Document = {};

  if (activeRole.name === "StoreHead") {
    if (activeRole.scopeType !== "store" || !activeRole.scopeId) {
      throwError("You cant do this");
      return [];
    }

    if (storeId && String(storeId) !== String(activeRole.scopeId)) {
      throwError("You cant do this");
      return [];
    }
  }

  if (tenderId) matchStage["tender._id"] = new ObjectId(tenderId as string);
  if (storeId && activeRole.name !== "StoreHead") {
    matchStage["store._id"] = new ObjectId(storeId as string);
  }
  if (wareId) matchStage["ware._id"] = new ObjectId(wareId as string);
  if (status) matchStage.status = status;
  if (paymentTerms) matchStage.paymentTerms = { $regex: paymentTerms, $options: "i" };

  if (Object.keys(matchStage).length > 0) {
    pipeline.push({ $match: matchStage });
  }

  const rangeMatch: Document = {};
  if (priceMin !== undefined || priceMax !== undefined) {
    rangeMatch.price = {};
    if (priceMin !== undefined) rangeMatch.price.$gte = Number(priceMin);
    if (priceMax !== undefined) rangeMatch.price.$lte = Number(priceMax);
  }
  if (deliveryTimeMin !== undefined || deliveryTimeMax !== undefined) {
    rangeMatch.deliveryTime = {};
    if (deliveryTimeMin !== undefined) rangeMatch.deliveryTime.$gte = Number(deliveryTimeMin);
    if (deliveryTimeMax !== undefined) rangeMatch.deliveryTime.$lte = Number(deliveryTimeMax);
  }
  if (submittedAtBefore !== undefined || submittedAtAfter !== undefined) {
    rangeMatch.submittedAt = {};
    if (submittedAtBefore !== undefined) rangeMatch.submittedAt.$lte = new Date(submittedAtBefore as string);
    if (submittedAtAfter !== undefined) rangeMatch.submittedAt.$gte = new Date(submittedAtAfter as string);
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

  return await tenderOffer
    .aggregation({ pipeline, projection: get })
    .toArray();
};
