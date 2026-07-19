import { enums, object, objectIdValidation } from "lesan";
import { selectStruct } from "../../../mod.ts";
import { activeRoleMixin } from "@lib";

export const updateStuffStatusValidator = () => {
  return object({
    set: object({
      ...activeRoleMixin,
      _id: objectIdValidation,
      stuffStatus: enums(["assigned", "ready_to_ship", "shipped", "delivered"]),
    }),
    get: selectStruct("purchasingRequest", 2),
  });
};
