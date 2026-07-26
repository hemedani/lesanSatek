import { enums, object, objectIdValidation, optional, string } from "lesan";
import { approval_status_array } from "../../../models/stepApproval.ts";
import { activeRoleMixin } from "@lib";

export const countValidator = () => {
  return object({
    set: object({
      ...activeRoleMixin,
      unitId: optional(objectIdValidation),
      status: optional(enums(approval_status_array)),
      stepId: optional(objectIdValidation),
      fromDate: optional(string()),
      toDate: optional(string()),
    }),
    get: object({ qty: optional(enums([0, 1])) }),
  });
};
