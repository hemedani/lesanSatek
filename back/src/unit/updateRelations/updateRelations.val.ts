import { object, objectIdValidation, optional } from "lesan";
import { activeRoleMixin } from "@lib";
import { selectStruct } from "../../../mod.ts";

export const updateRelationsValidator = () => {
  return object({
    set: object({
      ...activeRoleMixin,
      _id: objectIdValidation,
      organizationId: optional(objectIdValidation),
      parentUnitId: optional(objectIdValidation),
      creatorId: optional(objectIdValidation),
      headId: optional(objectIdValidation),
    }),
    get: selectStruct("unit", 2),
  });
};
