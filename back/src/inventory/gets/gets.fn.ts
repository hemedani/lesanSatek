import type { ActFn, Document } from "lesan";
import { ObjectId } from "lesan";
import { inventory, unit, coreApp } from "../../../mod.ts";
import type { MyContext } from "@lib";
import { throwError } from "../../../utils/throwError.ts";

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
      activeRoleId,
    },
    get,
  } = body.details;

  const { user }: MyContext = coreApp.contextFns.getContextModel() as MyContext;

  const activeRole = (user.roles || []).find(
    (r: { roleId: string }) => r.roleId === activeRoleId,
  ) as { name: string; scopeType?: string; scopeId?: string } | undefined;

  if (!activeRole) {
    throwError("Active role not found");
    return;
  }

  const pipeline: Document[] = [];
  const match: Document = {};

  const isWarehouseHead = await (async () => {
    if (activeRole.name !== "UnitHead") return false;
    if (activeRole.scopeType !== "unit" || !activeRole.scopeId) return false;
    const u = await unit.findOne({
      filters: { _id: new ObjectId(activeRole.scopeId) },
      projection: { type: 1 },
    }) as Document | null;
    return u?.type === "Warehouse";
  })();

  const unitsOfOrganization = async (
    organizationId: string,
  ): Promise<ObjectId[]> => {
    const orgUnits = await unit.aggregation({
      pipeline: [
        {
          $match: {
            "organization._id": new ObjectId(organizationId),
          },
        },
        { $project: { _id: 1 } },
      ],
    }).toArray();

    return orgUnits.map((u: Document) => u._id as ObjectId);
  };

  const userUnits = (user as unknown as { units?: { _id?: unknown }[] }).units ??
    [];

  let allowedUnitIds: ObjectId[] | null = null;

  if (activeRole.name === "Employee") {
    allowedUnitIds = userUnits.map((u) => new ObjectId(String(u._id)));
  } else if (activeRole.name === "UnitHead") {
    if (
      !isWarehouseHead && activeRole.scopeType === "unit" &&
      activeRole.scopeId
    ) {
      allowedUnitIds = [new ObjectId(activeRole.scopeId)];
    }
  } else if (activeRole.name === "OrgHead") {
    allowedUnitIds = activeRole.scopeType === "organization" &&
        activeRole.scopeId
      ? await unitsOfOrganization(String(activeRole.scopeId))
      : [];
  }

  const restrictToUnits = (ids: ObjectId[]) => {
    if (allowedUnitIds === null) {
      allowedUnitIds = ids;
      return;
    }

    const allowed = new Set(allowedUnitIds.map((id) => String(id)));
    allowedUnitIds = ids.filter((id) => allowed.has(String(id)));
  };

  if (search) {
    match.$or = [
      { "ware.name": { $regex: search, $options: "i" } },
      { "wareModel.name": { $regex: search, $options: "i" } },
    ];
  }
  wareId && (match["ware._id"] = new ObjectId(wareId));
  wareModelId && (match["wareModel._id"] = new ObjectId(wareModelId));

  if (unitId) {
    const requestedUnitId = new ObjectId(unitId as string);
    restrictToUnits([requestedUnitId]);

    if (
      !allowedUnitIds ||
      !allowedUnitIds.some((id) => String(id) === String(requestedUnitId))
    ) {
      throwError("You cant do this");
    }
  }

  if (organizationId) {
    restrictToUnits(await unitsOfOrganization(String(organizationId)));
  }

  if (allowedUnitIds !== null) {
    match["unit._id"] = { $in: allowedUnitIds };
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
