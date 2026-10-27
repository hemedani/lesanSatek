import {
  boolean,
  enums,
  object,
  objectIdValidation,
  optional,
  string,
} from "lesan";
import { activeRoleMixin, pagination } from "@lib";
import { selectStruct } from "../../../mod.ts";
import { costCenter_type_enums } from "../../../models/costCenter.ts";

export const getsValidator = () =>
  object({
    set: object({
      ...activeRoleMixin,
      organizationId: optional(objectIdValidation),
      ...pagination,
      sortBy: optional(
        enums(["createdAt", "updatedAt", "_id", "code", "name", "type"]),
      ),
      sortOrder: optional(enums(["asc", "desc"])),
      code: optional(string()),
      name: optional(string()),
      type: optional(costCenter_type_enums),
      isActive: optional(boolean()),
      unitId: optional(objectIdValidation),
    }),
    get: selectStruct("costCenter", 2),
  });
