import type { ActFn, Document } from "lesan";
import { ObjectId } from "lesan";
import { inventory, unit, coreApp } from "../../../mod.ts";
import type { MyContext } from "@lib";
import { throwError } from "../../../utils/throwError.ts";
import type { ActiveRole } from "../../../utils/authzPolicy.ts";
import { isManagerLike } from "../../../utils/authzPolicy.ts";

export const getWarehouseInventoryFn: ActFn = async (body) => {
  const {
    set: {
      wareModelId,
      wareId,
      search,
      page,
      limit,
      skip,
      sortBy,
      sortOrder,
      activeRoleId,
    },
    get,
  } = body.details;

  const { user }: MyContext = coreApp.contextFns.getContextModel() as MyContext;

  const activeRole = (user.roles || []).find(
    (r: { roleId: string }) => r.roleId === activeRoleId,
  ) as ActiveRole | undefined;

  if (!activeRole) {
    throwError("Active role not found");
    return;
  }

  const isUnrestricted = Boolean(user.isGhost) || isManagerLike(activeRole);
  const unitCollection = coreApp.odm.getCollection("unit");

  let organizationObjectId: ObjectId | null = null;

  if (!isUnrestricted) {
    if (activeRole.name !== "UnitHead") {
      throwError("You cant do this");
      return;
    }

    if (activeRole.scopeType !== "unit" || !activeRole.scopeId) {
      throwError("UnitHead active role must have a unit scope");
      return;
    }

    const currentUnit = await unit.findOne({
      filters: { _id: new ObjectId(activeRole.scopeId) },
      projection: { type: 1, organization: { _id: 1 } },
    }) as Document | null;

    if (!currentUnit) {
      throwError("Unit not found");
      return;
    }

    if (currentUnit.type !== "Warehouse") {
      throwError("This endpoint is only for heads of Warehouse-type units");
      return;
    }

    const orgRaw = currentUnit.organization as
      | Record<string, unknown>
      | undefined;
    if (!orgRaw || !orgRaw._id) {
      throwError("Unit has no associated organization");
      return;
    }

    organizationObjectId = orgRaw._id instanceof ObjectId
      ? orgRaw._id
      : new ObjectId(orgRaw._id as string);
  } else if (
    (activeRole.scopeType === "unit" ||
      activeRole.scopeType === "organization") && activeRole.scopeId
  ) {
    let scopedOrganizationId: unknown = activeRole.scopeId;

    if (activeRole.scopeType === "unit") {
      const scopedUnit = await unit.findOne({
        filters: { _id: new ObjectId(activeRole.scopeId) },
        projection: { organization: { _id: 1 } },
      }) as Document | null;

      if (!scopedUnit) {
        throwError("Unit not found");
        return;
      }

      scopedOrganizationId = (scopedUnit.organization as
        | Record<string, unknown>
        | undefined)?._id;
    }

    if (!scopedOrganizationId) {
      throwError("Unit has no associated organization");
      return;
    }

    organizationObjectId = scopedOrganizationId instanceof ObjectId
      ? scopedOrganizationId
      : new ObjectId(scopedOrganizationId as string);
  }

  const allOrgUnits = organizationObjectId
    ? await unitCollection.find({
      "organization._id": organizationObjectId,
    }).project({ _id: 1, type: 1 }).toArray() as Document[]
    : await unitCollection.find({}).project({
      _id: 1,
      type: 1,
    }).toArray() as Document[];

  const warehouseUnitIds = allOrgUnits
    .filter((u: Document) => u.type === "Warehouse")
    .map((u: Document) => u._id);

  const nonWarehouseUnitIds = allOrgUnits
    .filter((u: Document) => u.type !== "Warehouse")
    .map((u: Document) => u._id);

  const match: Record<string, unknown> = {};

  if (wareModelId) {
    match["wareModel._id"] = new ObjectId(wareModelId as string);
  }
  if (wareId) {
    match["ware._id"] = new ObjectId(wareId as string);
  }
  if (search) {
    match.$or = [
      { "ware.name": { $regex: search as string, $options: "i" } },
      { "wareModel.name": { $regex: search as string, $options: "i" } },
    ];
  }

  const sortField = sortBy || "_id";
  const sortDirection = sortOrder === "asc" ? 1 : -1;
  const calculatedSkip = skip ?? (limit || 50) * ((page || 1) - 1);
  const calculatedLimit = limit || 50;

  const buildPipeline = (unitIds: ObjectId[]) => {
    const pipeline: Document[] = [];
    const groupMatch = { ...match, "unit._id": { $in: unitIds } };
    if (Object.keys(groupMatch).length > 0) {
      pipeline.push({ $match: groupMatch });
    }
    pipeline.push({ $sort: { [sortField]: sortDirection } });
    pipeline.push({ $skip: calculatedSkip });
    pipeline.push({ $limit: calculatedLimit });
    return pipeline;
  };

  const [centralWarehouse, unitWarehouses, centralTotal, unitTotal] = await Promise.all([
    warehouseUnitIds.length > 0
      ? inventory.aggregation({
        pipeline: buildPipeline(warehouseUnitIds),
        projection: get,
      }).toArray()
      : Promise.resolve([]),
    nonWarehouseUnitIds.length > 0
      ? inventory.aggregation({
        pipeline: buildPipeline(nonWarehouseUnitIds),
        projection: get,
      }).toArray()
      : Promise.resolve([]),
    warehouseUnitIds.length > 0
      ? inventory.countDocument({ filter: { ...match, "unit._id": { $in: warehouseUnitIds } } })
      : Promise.resolve(0),
    nonWarehouseUnitIds.length > 0
      ? inventory.countDocument({ filter: { ...match, "unit._id": { $in: nonWarehouseUnitIds } } })
      : Promise.resolve(0),
  ]);

  return {
    ...(wareModelId ? { wareModelId } : {}),
    centralWarehouse: {
      items: centralWarehouse || [],
      total: centralTotal,
      page: page || 1,
      limit: calculatedLimit,
    },
    unitWarehouses: {
      items: unitWarehouses || [],
      total: unitTotal,
      page: page || 1,
      limit: calculatedLimit,
    },
  };
};
