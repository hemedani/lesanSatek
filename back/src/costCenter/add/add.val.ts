import { boolean, object, objectIdValidation, optional, string } from "lesan";
import { activeRoleMixin } from "@lib";
import { selectStruct } from "../../../mod.ts";
import { costCenter_type_enums } from "../../../models/costCenter.ts";

export const addValidator = () =>
  object({
    set: object({
      ...activeRoleMixin,
      code: string(),
      name: string(),
      description: optional(string()),
      type: optional(costCenter_type_enums),
      isActive: optional(boolean()),
      organizationId: objectIdValidation,
      unitId: optional(objectIdValidation),
      responsibleUserId: optional(objectIdValidation),
    }),
    get: selectStruct("costCenter", 1),
  });
