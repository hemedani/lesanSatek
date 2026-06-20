import { enums, object, objectIdValidation, optional, string } from "lesan";
import { selectStruct } from "../../../mod.ts";
import { request_status_array } from "../../../models/purchasingRequest.ts";
import { activeRoleMixin, pagination } from "@lib";

export const getsValidator = () => {
  return object({
    set: object({
      ...activeRoleMixin,
      ...pagination,
      search: optional(string()),
      status: optional(enums(request_status_array)),
      processId: optional(objectIdValidation),
      requesterId: optional(objectIdValidation),
      sortBy: optional(
        enums([
          "createdAt",
          "updatedAt",
          "title",
          "status",
          "amount",
          "currentStep",
          "requestedAt",
          "completedAt",
        ]),
      ),
      sortOrder: optional(enums(["asc", "desc"])),
    }),
    get: selectStruct("purchasingRequest", 2),
  });
};
