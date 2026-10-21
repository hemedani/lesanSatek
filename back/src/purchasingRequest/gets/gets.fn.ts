import type { ActFn, Document } from "lesan";
import { ObjectId } from "lesan";
import { purchasingRequest } from "../../../mod.ts";
import { getAuth } from "../../../utils/grantAccess.ts";
import { purchasingRequestReadMatch } from "../readScope.ts";

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
    },
    get,
  } = body.details;

  const { user, activeRole } = await getAuth();
  const readMatch = purchasingRequestReadMatch(activeRole, user);

  const pipeline: Document[] = [];

  search &&
    pipeline.push({
      $match: { $text: { $search: search } },
    });

  readMatch && pipeline.push({ $match: readMatch });

  if (activeRole.name === "StoreHead") {
    pipeline.push({ $match: { finalizedAt: { $exists: true } } });
  }

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
