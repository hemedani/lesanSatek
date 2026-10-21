import type { ActFn, Document } from "lesan";
import { ObjectId } from "lesan";
import { inventory } from "../../../mod.ts";
import { getAuth } from "../../../utils/grantAccess.ts";
import {
  idMatch,
  intersectObjectIds,
  inventoryAllowedUnitIds,
  unitsOfOrganization,
} from "../readScope.ts";

export const getsFn: ActFn = async (body) => {
  const {
    set: {
      page,
      limit,
      skip,
      search,
      sortBy,
      sortOrder,
      wareId,
      wareModelId,
      unitId,
      warehouseUnitId,
      organizationId,
    },
    get,
  } = body.details;

  const { user, activeRole } = await getAuth();
  const allowedUnitIds = await inventoryAllowedUnitIds(activeRole, user);

  const pipeline: Document[] = [];
  const match: Document = {};

  let effectiveUnitIds = allowedUnitIds;

  if (unitId) {
    effectiveUnitIds = intersectObjectIds(allowedUnitIds, [
      new ObjectId(unitId as string),
    ]);
  }

  if (organizationId) {
    const organizationUnitIds = await unitsOfOrganization(
      String(organizationId),
    );
    effectiveUnitIds = intersectObjectIds(
      effectiveUnitIds,
      organizationUnitIds,
    );
  }

  if (search) {
    match.$or = [
      { "ware.name": { $regex: search, $options: "i" } },
      { "wareModel.name": { $regex: search, $options: "i" } },
    ];
  }
  wareId && (match["ware._id"] = new ObjectId(wareId));
  wareModelId && (match["wareModel._id"] = new ObjectId(wareModelId));

  if (effectiveUnitIds !== null) {
    match["unit._id"] = idMatch(effectiveUnitIds);
  }

  warehouseUnitId &&
    (match["warehouseUnit._id"] = new ObjectId(warehouseUnitId as string));

  if (Object.keys(match).length > 0) {
    pipeline.push({ $match: match });
  }

  const sortField = sortBy || "_id";
  const sortDirection = sortOrder === "asc" ? 1 : -1;
  pipeline.push({ $sort: { [sortField]: sortDirection } });

  const calculatedSkip = skip ?? (limit || 50) * ((page || 1) - 1);
  pipeline.push({ $skip: calculatedSkip });
  pipeline.push({ $limit: limit || 50 });

  return await inventory
    .aggregation({
      pipeline,
      projection: get,
    })
    .toArray();
};
