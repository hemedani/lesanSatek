import { object, optional, string } from "lesan";
import { activeRoleMixin } from "@lib";

export const countValidator = () => {
  return object({
    set: object({
      ...activeRoleMixin,
      unitId: optional(string()),
      wareModelId: optional(string()),
      reason: optional(string()),
      patientId: optional(string()),
    }),
    get: object({}),
  });
};
