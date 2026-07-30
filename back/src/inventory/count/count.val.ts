import { enums, object, objectIdValidation, optional, string } from "lesan";
import { activeRoleMixin } from "@lib";

export const countValidator = () => {
  return object({
    set: object({
      ...activeRoleMixin,
      wareId: optional(objectIdValidation),
      wareModelId: optional(string()),
      unitId: optional(string()),
      warehouseUnitId: optional(string()),
    }),
    get: object({ qty: optional(enums([0, 1])) }),
  });
};
