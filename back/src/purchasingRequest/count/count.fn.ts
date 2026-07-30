import type { ActFn, Document } from "lesan";
import { ObjectId } from "lesan";
import { coreApp, purchasingRequest, unit } from "../../../mod.ts";
import type { MyContext } from "@lib";
import { throwError } from "../../../utils/throwError.ts";

export const countFn: ActFn = async (body) => {
  const {
    set: {
      status, processId, requesterId, storeId, wareId, wareTypeId,
      wareClassId, wareGroupId, unitId, createdBy, stuffStatus,
      fromDate, toDate, search, paymentOrderStatus, goodsReceiptStatus, activeRoleId,
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

  const filters: Document = {};

  if (activeRole.name === "Employee" || activeRole.name === "Ordinary") {
    filters["requester._id"] = user._id;
  } else if (activeRole.name === "UnitHead" && !unitId) {
    if (activeRole.scopeType === "unit" && activeRole.scopeId) {
      filters["requestingUnit._id"] = new ObjectId(activeRole.scopeId);
    }
  } else if (activeRole.name === "StoreHead") {
    if (activeRole.scopeType === "store" && activeRole.scopeId) {
      filters["store._id"] = new ObjectId(activeRole.scopeId);
      filters["finalizedAt"] = { $exists: true };
    }
  }

  if (unitId) {
    if (!["Manager", "Admin", "OrgHead"].includes(activeRole.name)) {
      const uId = new ObjectId(unitId as string);
      const unitDoc = await unit.aggregation({
        pipeline: [{ $match: { _id: uId } }],
        projection: { head: { _id: 1 } },
      }).toArray();

      if (
        unitDoc.length === 0 || !unitDoc[0].head ||
        unitDoc[0].head._id.toString() !== user._id.toString()
      ) {
        throwError("You can only view requests for your own unit");
      }
    }
    filters["requestingUnit._id"] = new ObjectId(unitId as string);
  }

  status && (filters["status"] = status);
  processId && (filters["process._id"] = new ObjectId(processId as string));
  requesterId && (filters["requester._id"] = new ObjectId(requesterId as string));
  storeId && (filters["store._id"] = new ObjectId(storeId as string));
  wareId && (filters["ware._id"] = new ObjectId(wareId as string));
  wareTypeId && (filters["wareType._id"] = new ObjectId(wareTypeId as string));
  wareClassId && (filters["wareClass._id"] = new ObjectId(wareClassId as string));
  wareGroupId && (filters["wareGroup._id"] = new ObjectId(wareGroupId as string));
  createdBy && (filters["requester._id"] = new ObjectId(createdBy as string));
  stuffStatus && (filters["stuffStatus"] = stuffStatus);

  if (fromDate || toDate) {
    const createdAtFilter: Document = {};
    fromDate && (createdAtFilter["$gte"] = new Date(fromDate as string));
    toDate && (createdAtFilter["$lte"] = new Date(toDate as string));
    filters["createdAt"] = createdAtFilter;
  }

  const needLookup = !!(paymentOrderStatus || goodsReceiptStatus);

  if (search || needLookup) {
    const pipeline: Document[] = [];

    if (search) {
      pipeline.push({ $match: { ...filters, $text: { $search: search } } });
    } else {
      pipeline.push({ $match: filters });
    }

    if (paymentOrderStatus) {
      pipeline.push({
        $lookup: {
          from: "paymentOrder",
          localField: "_id",
          foreignField: "purchasingRequest._id",
          as: "paymentOrders",
        },
      });
      if (paymentOrderStatus === "none") {
        pipeline.push({ $match: { paymentOrders: { $size: 0 } } });
      } else {
        pipeline.push({ $match: { "paymentOrders.status": paymentOrderStatus } });
      }
    }

    if (goodsReceiptStatus) {
      pipeline.push({
        $lookup: {
          from: "goodsReceipt",
          localField: "_id",
          foreignField: "purchasingRequest._id",
          as: "goodsReceipts",
        },
      });
      if (goodsReceiptStatus === "none") {
        pipeline.push({ $match: { goodsReceipts: { $size: 0 } } });
      } else {
        pipeline.push({ $match: { "goodsReceipts.status": goodsReceiptStatus } });
      }
    }

    pipeline.push({ $count: "count" });

    const result = await purchasingRequest
      .aggregation({ pipeline, projection: { count: 1 } })
      .toArray();
    return { qty: result.length > 0 ? result[0].count : 0 };
  }

  const foundedItemsLength = await purchasingRequest.countDocument({
    filter: filters,
  });

  return { qty: foundedItemsLength };
};
