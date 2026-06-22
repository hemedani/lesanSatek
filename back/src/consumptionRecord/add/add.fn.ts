import { type ActFn, ObjectId } from "lesan";
import { consumptionRecord, purchasingRequest, coreApp } from "../../../mod.ts";
import type { MyContext } from "@lib";
import { removeStock } from "../../../utils/inventoryManager.ts";

export const addFn: ActFn = async (body) => {
  const { set, get } = body.details;
  const { user }: MyContext = coreApp.contextFns.getContextModel() as MyContext;

  const { activeRoleId, unitId, consumedById, inventoryId, purchasingRequestId, ...rest } = set;

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

  // Remove from inventory
  await removeStock(
    unitId as string,
    rest.wareModelId as string,
    rest.wareModelName as string,
    rest.quantity as number,
    (rest.reason as string) || "consumption",
    consumedById as string,
    {
      wareId: rest.wareId as string | undefined,
      wareName: rest.wareName as string | undefined,
      referenceType: "consumptionRecord",
      referenceId: String(result._id),
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
            performedBy: consumedById as string,
            performedByName: `${user.first_name} ${user.last_name}`,
            performedAt: new Date(),
            details: {
              consumptionRecordId: result._id?.toString(),
              wareModelId: rest.wareModelId,
              wareModelName: rest.wareModelName,
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
