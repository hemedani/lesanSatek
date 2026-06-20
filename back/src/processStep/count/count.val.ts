import { enums, object, optional, string } from "lesan";
import { step_type_array } from "../../../models/processStep.ts";
import { activeRoleMixin } from "@lib";

export const countValidator = () => {
  return object({
    set: object({
      ...activeRoleMixin,
      name: optional(string()),
      stepType: optional(enums(step_type_array)),
    }),
    get: object({ qty: optional(enums([0, 1])) }),
  });
};
