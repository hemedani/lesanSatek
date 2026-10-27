import {
  boolean,
  number,
  object,
  objectIdValidation,
  optional,
  string,
} from "lesan";
import { activeRoleMixin } from "@lib";
import { costCenter_type_enums } from "../../../models/costCenter.ts";

export const countValidator = () =>
  object({
    set: object({
      ...activeRoleMixin,
      organizationId: optional(objectIdValidation),
      code: optional(string()),
      name: optional(string()),
      type: optional(costCenter_type_enums),
      isActive: optional(boolean()),
      unitId: optional(objectIdValidation),
    }),
    get: object({ count: optional(number()) }),
  });
