import { type ActFn, type Document, ObjectId } from "lesan";
import { goodsReceipt } from "../../../mod.ts";
import {
  checkFinanceUnitAccess,
  financeTargetOfPurchasingRequestBudget,
} from "../../../utils/checkFinanceUnitAccess.ts";

export const removeFn: ActFn = async (body) => {
  const {
    set: { _id, hardCascade },
  } = body.details;

  const receipt = await goodsReceipt.findOne({
    filters: { _id: new ObjectId(_id as string) },
    projection: { purchasingRequest: { _id: 1 } },
  }) as Document | null;

  const purchasingRequestId =
    (receipt?.purchasingRequest as Record<string, unknown> | undefined)?._id;

  await checkFinanceUnitAccess(
    await financeTargetOfPurchasingRequestBudget(purchasingRequestId),
  );

  return await goodsReceipt.deleteOne({
    filter: { _id: new ObjectId(_id as string) },
    hardCascade: hardCascade || false,
  });
};
