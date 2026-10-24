import { type ActFn, ObjectId } from "lesan";
import { purchasingRequest } from "../../../mod.ts";
import { getAuth } from "../../../utils/grantAccess.ts";
import {
  assertCanWritePurchasingRequest,
  loadPurchasingRequestForActor,
} from "../readScope.ts";

export const removeFn: ActFn = async (body) => {
  const {
    set: { _id, hardCascade },
  } = body.details;

  const { user, activeRole } = await getAuth();
  const pr = await loadPurchasingRequestForActor(activeRole, user, _id);
  assertCanWritePurchasingRequest(activeRole, user, pr);

  return await purchasingRequest.deleteOne({
    filter: { _id: new ObjectId(_id as string) },
    hardCascade: hardCascade || false,
  });
};
