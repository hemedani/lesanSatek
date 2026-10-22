import { type ActFn, type Document, ObjectId } from "lesan";
import { purchasingRequest, unit } from "../../../mod.ts";
import { getAuth } from "../../../utils/grantAccess.ts";
import { isManagerLike } from "../../../utils/authzPolicy.ts";
import { throwError } from "../../../utils/throwError.ts";
import { getWarehouseDashboard } from "../../../utils/inventoryManager.ts";
import { loadPurchasingRequestForActor } from "../readScope.ts";

const normalizeId = (value: unknown): string | null => {
  if (value === null || value === undefined || value === "") return null;

  return String(value);
};

type UnitDoc = {
  _id?: unknown;
  type?: unknown;
  organization?: { _id?: unknown } | null;
};

export const warehouseCheckFn: ActFn = async (body) => {
  const {
    set: { purchasingRequestId, warehouseUnitId },
  } = body.details;

  const { user, activeRole } = await getAuth();

  const pr = await loadPurchasingRequestForActor(
    activeRole,
    user,
    purchasingRequestId,
  );

  const whId = new ObjectId(warehouseUnitId as string);

  const warehouseUnit = await unit.findOne({
    filters: { _id: whId },
    projection: { _id: 1, type: 1, organization: { _id: 1 } },
  }) as UnitDoc | null;

  if (!warehouseUnit) {
    throwError("Warehouse unit not found");
    return;
  }

  if (!user?.isGhost && !isManagerLike(activeRole)) {
    const prOrganizationId = normalizeId(pr.organization?._id);
    const warehouseOrganizationId = normalizeId(
      warehouseUnit.organization?._id,
    );
    const isOwnWarehouseUnit = activeRole.name === "UnitHead" &&
      activeRole.scopeType === "unit" &&
      normalizeId(activeRole.scopeId) === normalizeId(warehouseUnitId) &&
      warehouseUnit.type === "Warehouse";

    if (
      !isOwnWarehouseUnit &&
      (!prOrganizationId || !warehouseOrganizationId ||
        prOrganizationId !== warehouseOrganizationId)
    ) {
      throwError("You cant do this");
      return;
    }
  }

  const prId = new ObjectId(purchasingRequestId as string);

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
    throw new Error("Purchasing request not found");
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
