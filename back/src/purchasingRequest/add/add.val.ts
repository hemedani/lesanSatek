import { array, number, object, objectIdValidation, optional, string } from "lesan";
import { selectStruct } from "../../../mod.ts";
import { request_status_emums } from "../../../models/purchasingRequest.ts";
import { activeRoleMixin } from "@lib";

export const addValidator = () => {
  return object({
    set: object({
      ...activeRoleMixin,
      title: string(),
      description: optional(string()),
      amount: optional(number()),
      status: optional(request_status_emums),
      currentStep: optional(number()),
      requestedAt: optional(string()),
      completedAt: optional(string()),
      organizationId: optional(objectIdValidation),
      processId: objectIdValidation,
      requestingUnitId: optional(objectIdValidation),
      attachmentIds: optional(array(objectIdValidation)),
    }),
    get: selectStruct("purchasingRequest", 2),
  });
};
