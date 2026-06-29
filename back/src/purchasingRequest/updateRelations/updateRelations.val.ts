import { array, object, objectIdValidation, optional } from "lesan";
import { selectStruct } from "../../../mod.ts";
import { activeRoleMixin } from "@lib";

export const updateRelationsValidator = () => {
  return object({
    set: object({
      ...activeRoleMixin,
      _id: objectIdValidation,
      requestingUnitId: optional(objectIdValidation),
      attachmentIds: optional(array(objectIdValidation)),
      tenderId: optional(objectIdValidation),
    }),
    get: selectStruct("purchasingRequest", 2),
  });
};
