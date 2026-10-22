import { type ActFn, type Infer, object, ObjectId } from "lesan";
import { purchasingRequest } from "../../../mod.ts";
import { purchasingRequest_pure } from "../../../models/purchasingRequest.ts";
import { getAuth } from "../../../utils/grantAccess.ts";
import { isScopeBypass } from "../../../utils/authzPolicy.ts";
import { throwError } from "../../../utils/throwError.ts";
import {
  assertCanWritePurchasingRequest,
  loadPurchasingRequestForActor,
} from "../readScope.ts";

export const updateFn: ActFn = async (body) => {
  const {
    set: { _id, title, description, estimatedAmount, quantity, status, currentStep, requestedAt, completedAt },
    get,
  } = body.details;

  const { user, activeRole } = await getAuth();
  const pr = await loadPurchasingRequestForActor(activeRole, user, _id);
  assertCanWritePurchasingRequest(activeRole, user, pr);

  if (!isScopeBypass(activeRole, user)) {
    if (
      status !== undefined || currentStep !== undefined ||
      completedAt !== undefined
    ) {
      throwError("You cant do this");
      return;
    }
  }

  const pureStruct = object(purchasingRequest_pure);
  const updateObj: Partial<Infer<typeof pureStruct>> = {
    updatedAt: new Date(),
  };

  title && (updateObj.title = title);
  description !== undefined && (updateObj.description = description);
  estimatedAmount !== undefined && (updateObj.estimatedAmount = estimatedAmount);
  quantity !== undefined && (updateObj.quantity = quantity);
  status && (updateObj.status = status);
  currentStep !== undefined && (updateObj.currentStep = currentStep);
  requestedAt && (updateObj.requestedAt = new Date(requestedAt as string));
  completedAt && (updateObj.completedAt = new Date(completedAt as string));

  return await purchasingRequest.findOneAndUpdate({
    filter: { _id: new ObjectId(_id as string) },
    update: { $set: updateObj },
    projection: get,
  });
};
