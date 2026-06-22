import { object, objectIdValidation, optional, string } from "lesan";
import { activeRoleMixin } from "@lib";
import { selectStruct } from "../../../mod.ts";

export const warehouseCheckValidator = () => {
  return object({
    set: object({
      ...activeRoleMixin,
      purchasingRequestId: objectIdValidation,
      warehouseUnitId: objectIdValidation,
    }),
    get: selectStruct("purchasingRequest", 2),
  });
};
