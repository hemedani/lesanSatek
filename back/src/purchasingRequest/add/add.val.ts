import { number, object, objectIdValidation, optional, string } from "lesan";
import { selectStruct } from "../../../mod.ts";
import { activeRoleMixin } from "@lib";

export const addValidator = () => {
  return object({
    set: object({
      ...activeRoleMixin,
      title: string(),
      description: optional(string()),
      quantity: number(),
      wareModelId: objectIdValidation,
    }),
    get: selectStruct("purchasingRequest", 2),
  });
};
