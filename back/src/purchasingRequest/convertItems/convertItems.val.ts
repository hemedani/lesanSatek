import { array, number, object, objectIdValidation, optional, string } from "lesan";
import { activeRoleMixin } from "@lib";
import { selectStruct } from "../../../mod.ts";

export const convertItemsValidator = () => {
  return object({
    set: object({
      ...activeRoleMixin,
      _id: objectIdValidation,
      items: array(object({
        wareModelId: string(),
        wareModelName: string(),
        wareId: optional(string()),
        wareName: optional(string()),
        quantity: number(),
        unitPrice: optional(number()),
        assignedFromId: optional(objectIdValidation),
      })),
    }),
    get: selectStruct("purchasingRequest", 2),
  });
};
