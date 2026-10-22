import { type ActFn, type Document, ObjectId } from "lesan";
import { paymentOrder } from "../../../mod.ts";
import { isManagerLike } from "../../../utils/authzPolicy.ts";
import {
  checkFinanceUnitAccess,
  financeTargetOfPaymentOrder,
} from "../../../utils/checkFinanceUnitAccess.ts";
import { getAuth } from "../../../utils/grantAccess.ts";
import { throwError } from "../../../utils/throwError.ts";

export const updateFn: ActFn = async (body) => {
  const {
    set: {
      _id,
      activeRoleId: _activeRoleId,
      purchasingRequestId,
      payToId,
      financialUnitId,
      ...fields
    },
    get,
  } = body.details;

  await checkFinanceUnitAccess(
    await financeTargetOfPaymentOrder(_id),
  );

  const { user, activeRole } = await getAuth();
  const bypass = Boolean(user?.isGhost) || isManagerLike(activeRole);

  if (!bypass) {
    if (purchasingRequestId !== undefined && purchasingRequestId !== null) {
      const existing = await paymentOrder.findOne({
        filters: { _id: new ObjectId(_id as string) },
        projection: { purchasingRequest: { _id: 1 } },
      }) as Document | null;

      const existingRequestId =
        (existing?.purchasingRequest as Record<string, unknown> | undefined)
          ?._id;

      if (
        existingRequestId === null || existingRequestId === undefined ||
        String(existingRequestId) !== String(purchasingRequestId)
      ) {
        throwError("You cant do this");
      }
    }

    if (financialUnitId !== undefined && financialUnitId !== null) {
      await checkFinanceUnitAccess({ unitId: String(financialUnitId) });
    }
  }

  const updateObj: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined) {
      updateObj[key] = value;
    }
  }

  const orderId = new ObjectId(_id as string);

  const updated = await paymentOrder.findOneAndUpdate({
    filter: { _id: orderId },
    update: { $set: updateObj },
    projection: get,
  });

  if (
    payToId !== undefined &&
    payToId !== null &&
    String(payToId).trim() !== "" &&
    ObjectId.isValid(String(payToId))
  ) {
    return await paymentOrder.addRelation({
      filters: { _id: orderId },
      relations: {
        payTo: {
          _ids: new ObjectId(String(payToId)),
          relatedRelations: {
            paymentOrders: true,
          },
        },
      },
      projection: get,
      replace: true,
    });
  }

  return updated;
};
