import { type ActFn, ObjectId } from "lesan";
import { paymentOrder, purchasingRequest, coreApp } from "../../../mod.ts";
import type { MyContext } from "@lib";
import { isManagerLike } from "../../../utils/authzPolicy.ts";
import { getAuth } from "../../../utils/grantAccess.ts";
import {
  checkFinanceUnitAccess,
  financeTargetOfPurchasingRequestBudget,
} from "../../../utils/checkFinanceUnitAccess.ts";

export const addFn: ActFn = async (body) => {
  const { set, get } = body.details;
  const { user }: MyContext = coreApp.contextFns.getContextModel() as MyContext;

  const { purchasingRequestId, issuedById, approvedById, payToId, financialUnitId, ...rest } = set;

  await checkFinanceUnitAccess(
    await financeTargetOfPurchasingRequestBudget(purchasingRequestId),
  );

  const { activeRole } = await getAuth();
  const bypass = Boolean(user.isGhost) ||
    (activeRole !== undefined && isManagerLike(activeRole));
  const effectiveIssuedById = bypass
    ? (issuedById ? String(issuedById) : String(user._id))
    : String(user._id);

  if (financialUnitId && !bypass) {
    await checkFinanceUnitAccess({ unitId: String(financialUnitId) });
  }

  const relations: Record<string, unknown> = {};

  relations.purchasingRequest = {
    _ids: new ObjectId(purchasingRequestId as string),
    relatedRelations: {
      paymentOrders: true,
    },
  };

  if (effectiveIssuedById) {
    relations.issuedBy = {
      _ids: new ObjectId(effectiveIssuedById),
      relatedRelations: {
        issuedPaymentOrders: true,
      },
    };
  }

  if (approvedById && bypass) {
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
            performed: {
              by: user._id.toString(),
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
