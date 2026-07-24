import { coerce, date, object, objectIdValidation, optional, string } from "lesan";
import { activeRoleMixin } from "@lib";
import { selectStruct } from "../../../mod.ts";

export const addValidator = () => {
  return object({
    set: object({
      ...activeRoleMixin,
      title: string(),
      description: optional(string()),
      deadline: coerce(date(), string(), (value) => new Date(value)),
      purchasingRequestId: objectIdValidation,
    }),
    get: selectStruct("tender", 1),
  });
};
