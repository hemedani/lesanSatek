import { type ActFn, ObjectId } from "lesan";
import { paymentOrder, purchasingRequest, coreApp } from "../../../mod.ts";
import type { MyContext } from "@lib";

export const addFn: ActFn = async (body) => {
  const { set, get } = body.details;
  const { user }: MyContext = coreApp.contextFns.getContextModel() as MyContext;

  const { activeRoleId, purchasingRequestId, issuedById, approvedById, payToId, financialUnitId, ...rest } = set;

  const relations: Record<string, unknown> = {};

  relations.purchasingRequest = {
    _ids: new ObjectId(purchasingRequestId as string),
    relatedRelations: {
      paymentOrders: true,
    },
  };

  if (issuedById) {
    relations.issuedBy = {
      _ids: new ObjectId(issuedById as string),
      relatedRelations: {
        issuedPaymentOrders: true,
      },
    };
  }

  if (approvedById) {
    relations.approvedBy = {
      _ids: new ObjectId(approvedById as string),
      relatedRelations: {
        approvedPaymentOrders: true,
      },
    };
  }

  if (payToId) {
    relations.payTo = {
      _ids: new ObjectId(payToId as string),
      relatedRelations: {
        paymentOrders: true,
      },
    };
  }

  if (financialUnitId) {
    relations.financialUnit = {
      _ids: new ObjectId(financialUnitId as string),
      relatedRelations: {
        paymentOrders: true,
      },
    };
  }

  const result = await paymentOrder.insertOne({
    doc: rest,
    relations,
    projection: get,
  });

  // Push "payment_ordered" history on the purchasing request
  if (purchasingRequestId && result) {
    await purchasingRequest.findOneAndUpdate({
      filter: { _id: new ObjectId(purchasingRequestId as string) },
      update: {
        $push: {
          history: {
            action: "payment_ordered",
            performedBy: user._id.toString(),
            performedByName: `${user.first_name} ${user.last_name}`,
            performedAt: new Date(),
            details: {
              paymentOrderId: result._id?.toString(),
              amount: rest.amount,
            },
          },
        },
      },
      projection: { _id: 1 },
    });
  }

  return result;
};
