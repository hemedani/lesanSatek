import { type ActFn, ObjectId } from "lesan";
import {
  purchasingRequest,
  tender,
  stepApproval,
  goodsReceipt,
  paymentOrder,
  coreApp,
} from "../../../mod.ts";
import type { MyContext } from "@lib";
import { throwError } from "../../../utils/throwError.ts";

export const updateRelationsFn: ActFn = async (body) => {
  const {
    set: { _id, requestingUnitId, organizationId, attachmentIds, tenderId, stepApprovalIds, goodsReceiptIds, paymentOrderIds, budgetLineId, storeId, wareId, wareTypeId, wareClassId, wareGroupId },
    get,
  } = body.details;

  const { user }: MyContext = coreApp.contextFns.getContextModel() as MyContext;

  const requestId = new ObjectId(_id);
  const now = new Date();

  if (requestingUnitId !== undefined) {
    await purchasingRequest.addRelation({
      filters: { _id: requestId },
      relations: {
        requestingUnit: {
          _ids: new ObjectId(requestingUnitId as string),
          relatedRelations: {
            purchaseRequests: true,
          },
        },
      },
      projection: get,
      replace: true,
    });
  }

  if (organizationId !== undefined) {
    if (organizationId) {
      await purchasingRequest.addRelation({
        filters: { _id: requestId },
        relations: {
          organization: {
            _ids: new ObjectId(organizationId as string),
            relatedRelations: { purchaseRequests: true },
          },
        },
        projection: get,
        replace: true,
      });
    } else {
      await purchasingRequest.findOneAndUpdate({
        filter: { _id: requestId },
        update: { $unset: { organization: "" } },
        projection: get,
      });
    }
  }

  if (attachmentIds !== undefined) {
    await purchasingRequest.addRelation({
      filters: { _id: requestId },
      relations: {
        attachments: {
          _ids: (attachmentIds as string[]).map((id: string) => new ObjectId(id)),
          relatedRelations: {},
        },
      },
      projection: get,
      replace: true,
    });
  }

  if (tenderId !== undefined) {
    if (tenderId) {
      await tender.addRelation({
        filters: { _id: new ObjectId(tenderId as string) },
        relations: {
          purchasingRequest: {
            _ids: requestId,
            relatedRelations: { tenders: true },
          },
        },
        projection: get,
        replace: true,
      });
    } else {
      const linkedTenders = await tender.aggregation({
        pipeline: [{ $match: { "purchasingRequest._id": requestId } }],
        projection: { _id: 1 },
      }).toArray();
      for (const t of linkedTenders) {
        await tender.findOneAndUpdate({
          filter: { _id: t._id as ObjectId },
          update: { $unset: { purchasingRequest: "" } },
          projection: { _id: 1 },
        });
      }
    }
  }

  if (stepApprovalIds !== undefined) {
    const saIds = (stepApprovalIds as string[]).map((id: string) => new ObjectId(id));
    await stepApproval.addRelation({
      filters: { _id: { $in: saIds } },
      relations: {
        purchasingRequest: {
          _ids: requestId,
          relatedRelations: { stepApprovals: true },
        },
      },
      projection: get,
      replace: true,
    });
  }

  if (goodsReceiptIds !== undefined) {
    if ((goodsReceiptIds as string[]).length > 0) {
      const grIds = (goodsReceiptIds as string[]).map((id: string) => new ObjectId(id));
      await goodsReceipt.addRelation({
        filters: { _id: { $in: grIds } },
        relations: {
          purchasingRequest: {
            _ids: requestId,
            relatedRelations: { goodsReceipts: true },
          },
        },
        projection: get,
        replace: true,
      });
    } else {
      const linkedGRs = await goodsReceipt.aggregation({
        pipeline: [{ $match: { "purchasingRequest._id": requestId } }],
        projection: { _id: 1 },
      }).toArray();
      for (const gr of linkedGRs) {
        await goodsReceipt.findOneAndUpdate({
          filter: { _id: gr._id as ObjectId },
          update: { $unset: { purchasingRequest: "" } },
          projection: { _id: 1 },
        });
      }
    }
  }

  if (paymentOrderIds !== undefined) {
    if ((paymentOrderIds as string[]).length > 0) {
      const poIds = (paymentOrderIds as string[]).map((id: string) => new ObjectId(id));
      await paymentOrder.addRelation({
        filters: { _id: { $in: poIds } },
        relations: {
          purchasingRequest: {
            _ids: requestId,
            relatedRelations: { paymentOrders: true },
          },
        },
        projection: get,
        replace: true,
      });
    } else {
      const linkedPOs = await paymentOrder.aggregation({
        pipeline: [{ $match: { "purchasingRequest._id": requestId } }],
        projection: { _id: 1 },
      }).toArray();
      for (const po of linkedPOs) {
        await paymentOrder.findOneAndUpdate({
          filter: { _id: po._id as ObjectId },
          update: { $unset: { purchasingRequest: "" } },
          projection: { _id: 1 },
        });
      }
    }
  }

  if (budgetLineId !== undefined) {
    if (budgetLineId) {
      await purchasingRequest.addRelation({
        filters: { _id: requestId },
        relations: {
          budgetLine: {
            _ids: new ObjectId(budgetLineId as string),
            relatedRelations: { purchasingRequests: true },
          },
        },
        projection: get,
        replace: true,
      });
    } else {
      await purchasingRequest.findOneAndUpdate({
        filter: { _id: requestId },
        update: { $unset: { budgetLine: "" } },
        projection: get,
      });
    }
  }

  if (storeId !== undefined) {
    await purchasingRequest.addRelation({
      filters: { _id: requestId },
      relations: {
        store: {
          _ids: new ObjectId(storeId as string),
          relatedRelations: { purchasingRequests: true },
        },
      },
      projection: get,
      replace: true,
    });
  }

  if (wareId !== undefined) {
    await purchasingRequest.addRelation({
      filters: { _id: requestId },
      relations: {
        ware: {
          _ids: new ObjectId(wareId as string),
          relatedRelations: { purchasingRequests: true },
        },
      },
      projection: get,
      replace: true,
    });
  }

  if (wareTypeId !== undefined) {
    await purchasingRequest.addRelation({
      filters: { _id: requestId },
      relations: {
        wareType: {
          _ids: new ObjectId(wareTypeId as string),
          relatedRelations: { purchasingRequests: true },
        },
      },
      projection: get,
      replace: true,
    });
  }

  if (wareClassId !== undefined) {
    await purchasingRequest.addRelation({
      filters: { _id: requestId },
      relations: {
        wareClass: {
          _ids: new ObjectId(wareClassId as string),
          relatedRelations: { purchasingRequests: true },
        },
      },
      projection: get,
      replace: true,
    });
  }

  if (wareGroupId !== undefined) {
    await purchasingRequest.addRelation({
      filters: { _id: requestId },
      relations: {
        wareGroup: {
          _ids: new ObjectId(wareGroupId as string),
          relatedRelations: { purchasingRequests: true },
        },
      },
      projection: get,
      replace: true,
    });
  }

  return await purchasingRequest.findOne({
    filters: { _id: requestId },
    projection: get,
  });
};
