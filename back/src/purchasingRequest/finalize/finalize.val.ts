import { array, enums, object, objectIdValidation, optional, string } from "lesan";
import { selectStruct } from "../../../mod.ts";
import { activeRoleMixin } from "@lib";

export const finalizeValidator = () => {
  return object({
    set: object({
      ...activeRoleMixin,
      _id: objectIdValidation,
      finalWinner: optional(enums(["stuff", "tender"])),
      budgetLineId: optional(objectIdValidation),
      postCompletionSteps: optional(array(object({
        name: string(),
        unitId: objectIdValidation,
        description: optional(string()),
        comment: optional(string()),
      }))),
    }),
    get: selectStruct("purchasingRequest", 3),
  });
};
