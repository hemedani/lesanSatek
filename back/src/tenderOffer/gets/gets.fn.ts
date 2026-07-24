import { type ActFn, type Document, ObjectId } from "lesan";
import { tenderOffer, coreApp } from "../../../mod.ts";
import type { MyContext } from "@lib";

export const getsFn: ActFn = async (body) => {
  const {
    set: {
      page, limit, skip, search, sortBy, sortOrder, activeRoleId,
      tenderId, storeId, wareId, status,
      priceMin, priceMax, deliveryTimeMin, deliveryTimeMax,
      paymentTerms, submittedAtBefore, submittedAtAfter,
    },
    get,
  } = body.details;

  const { user }: MyContext = coreApp.contextFns.getContextModel() as MyContext;

  const pipeline: Document[] = [];

  const matchStage: Document = {};

  const activeRole = (user.roles || []).find(
    (r: { roleId: string }) => r.roleId === activeRoleId,
  ) as { name: string; scopeType?: string; scopeId?: string } | undefined;

  if (activeRole?.name === "StoreHead") {
    if (activeRole.scopeType === "store" && activeRole.scopeId) {
      matchStage["store._id"] = new ObjectId(activeRole.scopeId);
    }
  }

  if (tenderId) matchStage["tender._id"] = new ObjectId(tenderId as string);
  if (storeId) matchStage["store._id"] = new ObjectId(storeId as string);
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
