import { type ActFn, type Document, ObjectId } from "lesan";
import { consumptionRecord, purchasingRequest, wareModel, coreApp } from "../../../mod.ts";
import type { MyContext } from "@lib";
import { removeStock } from "../../../utils/inventoryManager.ts";

export const addFn: ActFn = async (body) => {
  const { set, get } = body.details;
  const { user }: MyContext = coreApp.contextFns.getContextModel() as MyContext;

  const { activeRoleId, unitId, consumedById, inventoryId, purchasingRequestId, wareModelId, wareId, ...rest } = set;

  const activeRole = (user.roles || []).find((r: { roleId: string }) => r.roleId === activeRoleId);

  const relations: Record<string, unknown> = {};

  relations.unit = {
    _ids: new ObjectId(unitId as string),
    relatedRelations: {
      consumptionRecords: true,
    },
  };

  relations.consumedBy = {
    _ids: new ObjectId(consumedById as string),
    relatedRelations: {
      consumptionRecords: true,
    },
  };

  relations.wareModel = {
    _ids: new ObjectId(wareModelId as string),
    relatedRelations: {
      consumptionRecords: true,
    },
  };

  if (wareId) {
    relations.ware = {
      _ids: new ObjectId(wareId as string),
      relatedRelations: {
        consumptionRecords: true,
      },
    };
  }

  if (inventoryId) {
    relations.inventory = {
      _ids: new ObjectId(inventoryId as string),
      relatedRelations: {
        consumptionRecords: true,
      },
    };
  }

  const result = await consumptionRecord.insertOne({
    doc: rest,
    relations,
    projection: get,
  });

  if (!result) {
    throw new Error("Failed to create consumption record");
  }

  // Resolve wareModel name for removeStock (the wareModelName param is no longer stored, but removeStock accepts it)
  let resolvedWareModelName = "";
  if (wareModelId) {
    const wm = await wareModel.findOne({
      filters: { _id: new ObjectId(wareModelId as string) },
      projection: { name: 1 },
    }) as Record<string, unknown> | null;
    if (wm) {
      resolvedWareModelName = (wm.name as string) || "";
    }
  }

  // Remove from inventory
  await removeStock(
    unitId as string,
    wareModelId as string,
    rest.quantity as number,
    (rest.reason as string) || "consumption",
    consumedById as string,
    {
      wareId: wareId as string | undefined,
      referenceType: "consumptionRecord",
      referenceId: String(result._id),
      ...(inventoryId && { inventoryId: inventoryId as string }),
    },
  );

  // Push "goods_consumed" history on the purchasing request if linked
  if (purchasingRequestId) {
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
              consumptionRecordId: result._id?.toString(),
              wareModelId,
              wareModelName: resolvedWareModelName,
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
