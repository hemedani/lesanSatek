import { enums, object, objectIdValidation, optional, string } from "lesan";
import { activeRoleMixin } from "@lib";
import { approval_status_array } from "../../../models/stepApproval.ts";
import { selectStruct } from "../../../mod.ts";
import { pagination } from "@lib";

export const getsValidator = () => {
  return object({
    set: object({
      ...activeRoleMixin,
      ...pagination,
      sortBy: optional(enums(["createdAt", "updatedAt", "_id"])),
      sortOrder: optional(enums(["asc", "desc"])),
      purchasingRequestId: optional(objectIdValidation),
      processStepId: optional(objectIdValidation),
      unitId: optional(objectIdValidation),
      status: optional(enums(approval_status_array)),
    }),
    get: selectStruct("stepApproval", 2),
  });
};
