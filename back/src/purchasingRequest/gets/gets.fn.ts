import type { ActFn, Document } from "lesan";
import { ObjectId } from "lesan";
import { purchasingRequest, unit, coreApp } from "../../../mod.ts";
import type { MyContext } from "@lib";
import { throwError } from "../../../utils/throwError.ts";

export const getsFn: ActFn = async (body) => {
  const {
    set: {
      page,
      limit,
      skip,
      search,
      status,
      processId,
      requesterId,
      filterByAction,
      sortBy,
      sortOrder,
      storeId,
      wareId,
      wareTypeId,
      wareClassId,
      wareGroupId,
      unitId,
      stuffStatus,
      paymentOrderStatus,
      goodsReceiptStatus,
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

  const isWarehouseHead = await (async () => {
    if (activeRole.name !== "UnitHead") return false;
    if (activeRole.scopeType !== "unit" || !activeRole.scopeId) return false;
    const u = await unit.findOne({
      filters: { _id: new ObjectId(activeRole.scopeId) },
      projection: { type: 1 },
    }) as Document | null;
    return u?.type === "Warehouse";
  })();

  if (activeRole.name === "Employee" || activeRole.name === "Ordinary") {
    pipeline.push({
      $match: { "requester._id": user._id },
    });
  } else if (activeRole.name === "UnitHead") {
    if (isWarehouseHead) {
      pipeline.push({
        $match: { stuffStatus: "delivered" },
      });
    } else if (activeRole.scopeType === "unit" && activeRole.scopeId) {
      pipeline.push({
        $match: { "requestingUnit._id": new ObjectId(activeRole.scopeId) },
      });
    }
  } else if (activeRole.name === "OrgHead") {
    if (activeRole.scopeType === "organization" && activeRole.scopeId) {
      pipeline.push({
        $match: { "organization._id": new ObjectId(activeRole.scopeId) },
      });
    }
  } else if (activeRole.name === "StoreHead") {
    if (activeRole.scopeType === "store" && activeRole.scopeId) {
      pipeline.push({
        $match: {
          "store._id": new ObjectId(activeRole.scopeId),
          finalizedAt: { $exists: true },
        },
      });
    }
  }

  search &&
    pipeline.push({
      $match: { $text: { $search: search } },
    });

  status &&
    pipeline.push({
      $match: { status },
    });

  processId &&
    pipeline.push({
      $match: { "process._id": new ObjectId(processId as string) },
    });

  requesterId &&
    pipeline.push({
      $match: { "requester._id": new ObjectId(requesterId as string) },
    });

  filterByAction &&
    pipeline.push({
      $match: { "history.action": filterByAction },
    });

  storeId &&
    pipeline.push({
      $match: { "store._id": new ObjectId(storeId as string) },
    });

  wareId &&
    pipeline.push({
      $match: { "ware._id": new ObjectId(wareId as string) },
    });

  wareTypeId &&
    pipeline.push({
      $match: { "wareType._id": new ObjectId(wareTypeId as string) },
    });

  wareClassId &&
    pipeline.push({
      $match: { "wareClass._id": new ObjectId(wareClassId as string) },
    });

  wareGroupId &&
    pipeline.push({
      $match: { "wareGroup._id": new ObjectId(wareGroupId as string) },
    });

  stuffStatus &&
    pipeline.push({
      $match: { stuffStatus },
    });

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

  if (unitId) {
    if (!["Manager", "Admin", "OrgHead"].includes(activeRole.name)) {
      const unitDoc = await unit.aggregation({
        pipeline: [{ $match: { _id: new ObjectId(unitId as string) } }],
        projection: { head: { _id: 1 } },
      }).toArray();

      if (
        unitDoc.length === 0 || !unitDoc[0].head ||
        unitDoc[0].head._id.toString() !== user._id.toString()
      ) {
        throwError("You can only view requests for your own unit");
      }
    }

    pipeline.push({
      $match: { "requestingUnit._id": new ObjectId(unitId as string) },
    });
  }

  if (search && (!sortBy || sortBy === "relevance")) {
    pipeline.push({
      $addFields: {
        textScore: { $meta: "textScore" },
      },
    });
  }

  const sortField = sortBy === "relevance" ? "textScore" : (sortBy || "_id");
  const sortDirection = sortOrder === "asc" ? 1 : -1;
  pipeline.push({ $sort: { [sortField]: sortDirection } });

  const calculatedSkip = skip ?? (limit || 50) * ((page || 1) - 1);
  pipeline.push({ $skip: calculatedSkip });
  pipeline.push({ $limit: limit || 50 });

  return await purchasingRequest
    .aggregation({
      pipeline,
      projection: get,
    })
    .toArray();
};
