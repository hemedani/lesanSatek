import { enums, object, objectIdValidation, optional, string } from "lesan";
import { request_status_array } from "../../../models/purchasingRequest.ts";
import { activeRoleMixin } from "@lib";

const stuff_status_array = [
  "none",
  "assigned",
  "ready_to_ship",
  "shipped",
  "delivered",
  "received",
  "cancelled",
] as const;

export const countValidator = () => {
  return object({
    set: object({
      ...activeRoleMixin,
      status: optional(enums(request_status_array)),
      processId: optional(objectIdValidation),
      requesterId: optional(objectIdValidation),
      storeId: optional(objectIdValidation),
      wareId: optional(objectIdValidation),
      wareTypeId: optional(objectIdValidation),
      wareClassId: optional(objectIdValidation),
      wareGroupId: optional(objectIdValidation),
      unitId: optional(objectIdValidation),
      createdBy: optional(objectIdValidation),
      stuffStatus: optional(enums(stuff_status_array)),
      fromDate: optional(string()),
      toDate: optional(string()),
      search: optional(string()),
    }),
    get: object({ qty: optional(enums([0, 1])) }),
  });
};
