import { enums, object, objectIdValidation, optional } from "lesan";
import { activeRoleMixin } from "@lib";

export const seedDefaultChartOfAccountsValidator = () =>
  object({
    set: object({
      ...activeRoleMixin,
      organizationId: objectIdValidation,
    }),
    get: object({ success: optional(enums([0, 1])) }),
  });
