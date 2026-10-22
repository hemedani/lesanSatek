import { type ActFn, type Document, ObjectId } from "lesan";
import { paymentOrder } from "../../../mod.ts";
import { isManagerLike } from "../../../utils/authzPolicy.ts";
import {
  activeFinanceOrganizationId,
  assertCanReadPaymentOrder,
} from "../../../utils/financeScope.ts";
import { getAuth } from "../../../utils/grantAccess.ts";
import { throwError } from "../../../utils/throwError.ts";

export const getFn: ActFn = async (body) => {
  const {
    set: { _id },
    get,
  } = body.details;

  const { user, activeRole } = await getAuth();
  const financeOrganizationId = await activeFinanceOrganizationId(
    activeRole,
    user,
  );

  const orderId = new ObjectId(_id as string);
  const founded = await paymentOrder.findOne({
    filters: { _id: orderId },
    projection: {
      purchasingRequest: { organization: { _id: 1 } },
      financialUnit: { _id: 1 },
    },
  }) as Document | null;

  if (!founded) {
    if (!(user.isGhost || isManagerLike(activeRole))) {
      throwError("You cant do this");
    }
  } else {
    assertCanReadPaymentOrder(
      activeRole,
      user,
      founded,
      financeOrganizationId,
    );
  }

  return await paymentOrder
    .aggregation({
      pipeline: [{ $match: { _id: orderId } }],
      projection: get,
    })
    .toArray();
};
