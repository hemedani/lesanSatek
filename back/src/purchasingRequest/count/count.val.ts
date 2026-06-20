import { enums, object, objectIdValidation, optional } from "lesan";
import { request_status_array } from "../../../models/purchasingRequest.ts";
import { activeRoleMixin } from "@lib";

export const countValidator = () => {
  return object({
    set: object({
      ...activeRoleMixin,
      status: optional(enums(request_status_array)),
      processId: optional(objectIdValidation),
      requesterId: optional(objectIdValidation),
    }),
    get: object({ qty: optional(enums([0, 1])) }),
  });
};
