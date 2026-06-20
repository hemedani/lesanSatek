import { enums, object, objectIdValidation, optional, string } from "lesan";
import { activeRoleMixin } from "@lib";
import { selectStruct } from "../../../mod.ts";

export const decision_status_array = ["approved", "rejected"];

export const submitDecisionValidator = () => {
  return object({
    set: object({
      ...activeRoleMixin,
      purchasingRequestId: objectIdValidation,
      processStepId: objectIdValidation,
      unitId: objectIdValidation,
      status: enums(decision_status_array),
      comment: optional(string()),
    }),
    get: selectStruct("stepApproval", 2),
  });
};
