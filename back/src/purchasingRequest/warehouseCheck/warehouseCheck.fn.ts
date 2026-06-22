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
      status: 1,
      currentStep: 1,
      items: 1,
      "requestingUnit._id": 1,
      "requestingUnitInfo.name": 1,
      "requestingUnitInfo._id": 1,
    },
  }).toArray();

  if (requests.length === 0) {
    throw { error: "Purchasing request not found" };
  }

  const req = requests[0] as Document;
  const items = (req.items || []) as Array<{
    wareModelId: string;
    wareModelName: string;
    wareId?: string;
    wareName?: string;
    quantity: number;
  }>;

  const stockInfo = await Promise.all(
    items.map(async (item) => {
      const dashboard = await getWarehouseDashboard(
        warehouseUnitId as string,
        item.wareModelId,
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
        wareModelId: item.wareModelId,
        wareModelName: item.wareModelName,
        requestedQuantity: item.quantity,
        warehouseStock: warehouseStock?.quantity || 0,
        unitStock: unitStock?.quantity || 0,
        sufficientInWarehouse: (warehouseStock?.quantity || 0) >= item.quantity,
        allStocks: dashboard,
      };
    }),
  );

  return {
    purchasingRequest: {
      _id: req._id,
      title: req.title,
      status: req.status,
      requestingUnit: req.requestingUnitInfo?.name || req.requestingUnit?._id,
    },
    items: stockInfo,
    summary: {
      totalItems: items.length,
      itemsFullyStocked: stockInfo.filter((s) => s.sufficientInWarehouse).length,
      warehouseUnitId,
    },
  };
};
