import { array, number, object, objectIdValidation, optional, string } from "lesan";
import { selectStruct } from "../../../mod.ts";
import { activeRoleMixin } from "@lib";
import { request_status_emums } from "../../../models/purchasingRequest.ts";

export const addValidator = () => {
  return object({
    set: object({
      ...activeRoleMixin,
      title: string(),
      description: optional(string()),
      estimatedAmount: optional(number()),
      quantity: number(),
      status: optional(request_status_emums),
      currentStep: optional(number()),
      requestedAt: optional(string()),
      completedAt: optional(string()),
      organizationId: optional(objectIdValidation),
      processId: objectIdValidation,
      wareModelId: objectIdValidation,
      requestingUnitId: optional(objectIdValidation),
      attachmentIds: optional(array(objectIdValidation)),
    }),
    get: selectStruct("purchasingRequest", 2),
  });
};
