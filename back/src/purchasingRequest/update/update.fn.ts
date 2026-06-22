import { type ActFn, type Infer, object, ObjectId } from "lesan";
import { purchasingRequest } from "../../../mod.ts";
import { purchasingRequest_pure } from "../../../models/purchasingRequest.ts";

export const updateFn: ActFn = async (body) => {
  const {
    set: { _id, title, description, amount, status, currentStep, requestedAt, completedAt, items },
    get,
  } = body.details;

  const pureStruct = object(purchasingRequest_pure);
  const updateObj: Partial<Infer<typeof pureStruct>> = {
    updatedAt: new Date(),
  };

  title && (updateObj.title = title);
  description !== undefined && (updateObj.description = description);
  amount !== undefined && (updateObj.amount = amount);
  status && (updateObj.status = status);
  currentStep !== undefined && (updateObj.currentStep = currentStep);
  requestedAt && (updateObj.requestedAt = new Date(requestedAt as string));
  completedAt && (updateObj.completedAt = new Date(completedAt as string));
  items !== undefined && (updateObj.items = items);

  return await purchasingRequest.findOneAndUpdate({
    filter: { _id: new ObjectId(_id as string) },
    update: { $set: updateObj },
    projection: get,
  });
};
