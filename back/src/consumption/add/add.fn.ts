import { type ActFn, type Document, ObjectId } from "lesan";
import { consumption, purchasingRequest, ware, coreApp } from "../../../mod.ts";
import type { MyContext } from "@lib";
import { removeStock } from "../../../utils/inventoryManager.ts";
import { throwError } from "../../../utils/throwError.ts";

export const addFn: ActFn = async (body) => {
  const { set, get } = body.details;
  const { user }: MyContext = coreApp.contextFns.getContextModel() as MyContext;

  const { activeRoleId, unitId: rawUnitId, consumedById: rawConsumedById, inventoryId, purchasingRequestId, wareId, ...rest } = set;

  const activeRole = (user.roles || []).find((r: { roleId: string }) => r.roleId === activeRoleId);

  const unitId = rawUnitId || (activeRole?.scopeType === "unit" ? activeRole.scopeId : undefined);
  const consumedById = rawConsumedById || user._id;

  if (!unitId) {
    throwError("unitId is required and cannot be derived from active role");
    return;
  }

  // Fetch ware to derive hierarchy
  const wareDoc = await ware.findOne({
    filters: { _id: new ObjectId(wareId as string) },
    projection: {
      _id: 1,
      "wareModel._id": 1,
      "wareGroup._id": 1,
      "wareClass._id": 1,
      "wareType._id": 1,
    },
  }) as Document;

  if (!wareDoc) {
    throwError("Ware not found");
    return;
  }

  const relations: Record<string, unknown> = {};

  relations.unit = {
    _ids: new ObjectId(unitId as string),
    relatedRelations: { consumptions: true },
  };

  relations.consumedBy = {
    _ids: new ObjectId(consumedById as string),
    relatedRelations: { consumptions: true },
  };

  relations.ware = {
    _ids: new ObjectId(wareId as string),
    relatedRelations: { consumptions: true },
  };

  relations.wareModel = {
    _ids: (wareDoc.wareModel as Record<string, unknown>)?._id as ObjectId,
    relatedRelations: { consumptions: true },
  };

  relations.wareGroup = {
    _ids: (wareDoc.wareGroup as Record<string, unknown>)?._id as ObjectId,
    relatedRelations: { consumptions: true },
  };

  relations.wareClass = {
    _ids: (wareDoc.wareClass as Record<string, unknown>)?._id as ObjectId,
    relatedRelations: { consumptions: true },
  };

  relations.wareType = {
    _ids: (wareDoc.wareType as Record<string, unknown>)?._id as ObjectId,
    relatedRelations: { consumptions: true },
  };

  if (inventoryId) {
    relations.inventory = {
      _ids: new ObjectId(inventoryId as string),
      relatedRelations: { consumptions: true },
    };
  }

  const result = await consumption.insertOne({
    doc: rest,
    relations,
    projection: get,
  });

  if (!result) {
    throw new Error("Failed to create consumption record");
  }

  // Remove from inventory
  await removeStock(
    unitId as string,
    wareId as string,
    rest.quantity as number,
    (rest.reason as string) || "consumption",
    consumedById as string,
    {
      referenceType: "consumption",
      referenceId: String(result._id),
      ...(inventoryId && { inventoryId: inventoryId as string }),
    },
  );

  // Push "goods_consumed" history on the purchasing request if linked
  if (purchasingRequestId) {
    const wareDoc2 = wareDoc as Record<string, unknown>;
    const wareModelName = ((wareDoc2.wareModel as Record<string, unknown>)?.name as string) || "";

    await purchasingRequest.findOneAndUpdate({
      filter: { _id: new ObjectId(purchasingRequestId as string) },
      update: {
        $push: {
          history: {
            action: "goods_consumed",
            performed: {
              by: consumedById as string,
              name: `${user.first_name} ${user.last_name}`,
              at: new Date(),
              role: activeRole ? {
                id: activeRole.roleId,
                name: activeRole.name,
                scopeType: activeRole.scopeType,
                scopeId: activeRole.scopeId,
              } : { id: "", name: "" },
            },
            details: {
              consumptionId: result._id?.toString(),
              wareId,
              wareModelName,
              quantity: rest.quantity,
            },
          },
        },
      },
      projection: { _id: 1 },
    });
  }

  return result;
};
