import { coerce, date, object, objectIdValidation, optional, string } from "lesan";
import { activeRoleMixin } from "@lib";
import { selectStruct } from "../../../mod.ts";
import { tender_status_emums } from "../../../models/tender.ts";

export const addValidator = () => {
  return object({
    set: object({
      ...activeRoleMixin,
      title: string(),
      description: optional(string()),
      status: optional(tender_status_emums),
      deadline: coerce(date(), string(), (value) => new Date(value)),
      purchasingRequestId: objectIdValidation,
      createdById: objectIdValidation,
    }),
    get: selectStruct("tender", 1),
  });
};
