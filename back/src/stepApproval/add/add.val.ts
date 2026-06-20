import { coerce, enums, object, objectIdValidation, optional, string } from "lesan";
import { activeRoleMixin } from "@lib";
import { selectStruct } from "../../../mod.ts";
import { approval_status_array } from "../../../models/stepApproval.ts";

export const addValidator = () => {
  return object({
    set: object({
      ...activeRoleMixin,
      status: coerce(
        enums(approval_status_array),
        enums(approval_status_array),
        (value) => value as typeof approval_status_array[number],
      ),
      comment: optional(string()),
      purchasingRequestId: objectIdValidation,
      processStepId: objectIdValidation,
      unitId: objectIdValidation,
    }),
    get: selectStruct("stepApproval", 1),
  });
};
