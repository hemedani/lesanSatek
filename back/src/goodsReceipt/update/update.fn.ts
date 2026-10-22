import { type ActFn, type Document, ObjectId } from "lesan";
import { goodsReceipt } from "../../../mod.ts";
import {
  checkFinanceUnitAccess,
  financeTargetOfPurchasingRequestBudget,
} from "../../../utils/checkFinanceUnitAccess.ts";

export const updateFn: ActFn = async (body) => {
  const {
    set: { _id, ...fields },
    get,
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

  const updateObj: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined) {
      updateObj[key] = value;
    }
  }

  return await goodsReceipt.findOneAndUpdate({
    filter: { _id: new ObjectId(_id as string) },
    update: { $set: updateObj },
    projection: get,
  });
};
