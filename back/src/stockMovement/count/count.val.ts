import { enums, object, optional, string } from "lesan";
import { activeRoleMixin } from "@lib";
import { stockMovement_reason_emums } from "../../../models/stockMovement.ts";

export const countValidator = () => {
  return object({
    set: object({
      ...activeRoleMixin,
      unitId: optional(string()),
      wareModelId: optional(string()),
      reason: optional(stockMovement_reason_emums),
      referenceType: optional(string()),
      referenceId: optional(string()),
    }),
    get: object({ qty: optional(enums([0, 1])) }),
  });
};
