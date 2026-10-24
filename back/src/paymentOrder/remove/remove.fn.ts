import { type ActFn, ObjectId } from "lesan";
import { paymentOrder } from "../../../mod.ts";
import {
  checkFinanceUnitAccess,
  financeTargetOfPaymentOrder,
} from "../../../utils/checkFinanceUnitAccess.ts";

export const removeFn: ActFn = async (body) => {
  await checkFinanceUnitAccess(
    await financeTargetOfPaymentOrder(body.details.set._id),
  );

  const {
    set: { _id, hardCascade },
  } = body.details;

  return await paymentOrder.deleteOne({
    filter: { _id: new ObjectId(_id as string) },
    hardCascade: hardCascade || false,
  });
};
