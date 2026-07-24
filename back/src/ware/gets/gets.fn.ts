import type { ActFn, Document } from "lesan";
import { ObjectId } from "lesan";
import { ware } from "../../../mod.ts";

export const getsFn: ActFn = async (body) => {
  const {
    set: {
      page, limit, skip, search, sortBy, sortOrder,
      wareModelId, wareClassId, wareGroupId, wareTypeId, manufacturerId,
      brand, priceMin, priceMax, irc, umdns, gtin,
    },
    get,
  } = body.details;

  const pipeline: Document[] = [];

  const matchStage: Document = {};

  if (wareModelId) matchStage["wareModel._id"] = new ObjectId(wareModelId);
  if (wareClassId) matchStage["wareClass._id"] = new ObjectId(wareClassId);
  if (wareGroupId) matchStage["wareGroup._id"] = new ObjectId(wareGroupId);
  if (wareTypeId) matchStage["wareType._id"] = new ObjectId(wareTypeId);
  if (manufacturerId) matchStage["manufacturer._id"] = new ObjectId(manufacturerId);

  if (brand) matchStage.brand = { $regex: brand, $options: "i" };
  if (irc) matchStage.irc = irc;
  if (umdns !== undefined) matchStage.umdns = umdns;
  if (gtin !== undefined) matchStage.gtin = gtin;

  if (Object.keys(matchStage).length > 0) {
    pipeline.push({ $match: matchStage });
  }

  const rangeMatch: Document = {};
  if (priceMin !== undefined || priceMax !== undefined) {
    rangeMatch.price = {};
    if (priceMin !== undefined) rangeMatch.price.$gte = Number(priceMin);
    if (priceMax !== undefined) rangeMatch.price.$lte = Number(priceMax);
  }
  if (Object.keys(rangeMatch).length > 0) {
    pipeline.push({ $match: rangeMatch });
  }

  if (search) {
    pipeline.push({ $match: { $text: { $search: search } } });
  }

  if (search && (!sortBy || sortBy === "relevance")) {
    pipeline.push({
      $addFields: {
        textScore: { $meta: "textScore" },
      },
    });
  }

  const sortField = sortBy === "relevance" ? "textScore" : (sortBy || "_id");
  const sortDirection = sortOrder === "asc" ? 1 : -1;
  pipeline.push({ $sort: { [sortField]: sortDirection } });

  const calculatedSkip = skip ?? (limit || 50) * ((page || 1) - 1);
  pipeline.push({ $skip: calculatedSkip });
  pipeline.push({ $limit: limit || 50 });

  return await ware
    .aggregation({ pipeline, projection: get })
    .toArray();
};
