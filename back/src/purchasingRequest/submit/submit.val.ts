import { array, number, object, objectIdValidation, optional, string } from "lesan";
import { selectStruct } from "../../../mod.ts";
import { activeRoleMixin } from "@lib";

export const submitValidator = () => {
  return object({
    set: object({
      ...activeRoleMixin,
      title: string(),
      description: optional(string()),
      estimatedAmount: optional(number()),
      quantity: number(),
      wareModelId: objectIdValidation,
      requestingUnitId: optional(objectIdValidation),
      attachmentIds: optional(array(objectIdValidation)),
      budgetLineId: optional(objectIdValidation),
      storeId: optional(objectIdValidation),
      wareId: optional(objectIdValidation),
      wareTypeId: optional(objectIdValidation),
      wareClassId: optional(objectIdValidation),
      wareGroupId: optional(objectIdValidation),
    }),
    get: selectStruct("purchasingRequest", 2),
  });
};
