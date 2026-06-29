import { number, object, objectIdValidation, optional, string } from "lesan";
import { selectStruct } from "../../../mod.ts";
import { request_status_emums } from "../../../models/purchasingRequest.ts";
import { activeRoleMixin } from "@lib";

export const updateValidator = () => {
  return object({
    set: object({
      ...activeRoleMixin,
      _id: objectIdValidation,
      title: optional(string()),
      description: optional(string()),
      estimatedAmount: optional(number()),
      quantity: optional(number()),
      status: optional(request_status_emums),
      currentStep: optional(number()),
      requestedAt: optional(string()),
      completedAt: optional(string()),
      organizationId: optional(objectIdValidation),
    }),
    get: selectStruct("purchasingRequest", 1),
  });
};
