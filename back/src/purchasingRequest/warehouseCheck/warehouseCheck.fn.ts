import { type ActFn, type Document, ObjectId } from "lesan";
import { purchasingRequest } from "../../../mod.ts";
import { getWarehouseDashboard } from "../../../utils/inventoryManager.ts";

export const warehouseCheckFn: ActFn = async (body) => {
  const {
    set: { purchasingRequestId, warehouseUnitId },
    get,
  } = body.details;

  const prId = new ObjectId(purchasingRequestId as string);
  const whId = new ObjectId(warehouseUnitId as string);

  const requests = await purchasingRequest.aggregation({
    pipeline: [
      { $match: { _id: prId } },
      {
        $lookup: {
          from: "unit",
          localField: "requestingUnit",
          foreignField: "_id",
          as: "requestingUnitInfo",
        },
      },
      { $unwind: { path: "$requestingUnitInfo", preserveNullAndEmptyArrays: true } },
    ],
    projection: {
      _id: 1,
      title: 1,
      description: 1,
      amount: 1,
      quantity: 1,
      status: 1,
      currentStep: 1,
      wareModel: { _id: 1, name: 1, enName: 1 },
      "requestingUnit._id": 1,
      "requestingUnitInfo.name": 1,
      "requestingUnitInfo._id": 1,
    },
  }).toArray();

  if (requests.length === 0) {
    throw { error: "Purchasing request not found" };
  }

  const req = requests[0] as Document;
  const wareModel = req.wareModel as Record<string, unknown> | undefined;
  const requestedQuantity = req.quantity as number || 0;
  const wareModelId = wareModel?._id?.toString() || "";
  const wareModelName = (wareModel?.name as string) || "";

  const dashboard = await getWarehouseDashboard(
    warehouseUnitId as string,
    wareModelId,
  );

  const warehouseStock = dashboard.find(
    (d: Document) => d.unitId?.toString() === whId.toString(),
  );
  const unitStock = dashboard.find(
    (d: Document) =>
      d.unitId?.toString() ===
      (req.requestingUnit?._id?.toString() || req.requestingUnitInfo?._id?.toString()),
  );

  return {
    purchasingRequest: {
      _id: req._id,
      title: req.title,
      status: req.status,
      requestingUnit: req.requestingUnitInfo?.name || req.requestingUnit?._id,
    },
    wareCheck: {
      wareModelId,
      wareModelName,
      requestedQuantity,
      warehouseStock: warehouseStock?.quantity || 0,
      unitStock: unitStock?.quantity || 0,
      sufficientInWarehouse: (warehouseStock?.quantity || 0) >= requestedQuantity,
      allStocks: dashboard,
    },
  };
};
