import { type ActFn, type Document, ObjectId } from "lesan";
import { goodsReceipt } from "../../../mod.ts";
import { isScopeBypass } from "../../../utils/authzPolicy.ts";
import {
  activeFinanceOrganizationId,
  assertCanReadGoodsReceipt,
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

  const receiptId = new ObjectId(_id as string);
  const founded = await goodsReceipt.findOne({
    filters: { _id: receiptId },
    projection: { purchasingRequest: { organization: { _id: 1 } } },
  }) as Document | null;

  if (!founded) {
    if (!isScopeBypass(activeRole, user)) {
      throwError("You cant do this");
    }
  } else {
    assertCanReadGoodsReceipt(activeRole, user, founded, financeOrganizationId);
  }

  return await goodsReceipt
    .aggregation({
      pipeline: [{ $match: { _id: receiptId } }],
      projection: get,
    })
    .toArray();
};
