import { object, optional, string } from "lesan";
import { activeRoleMixin } from "@lib";
import { selectStruct } from "../../../mod.ts";

export const updateRelationsValidator = () => {
  return object({
    set: object({
      ...activeRoleMixin,
      _id: string(),
      fiscalYearId: optional(string()),
    }),
    get: selectStruct("budgetLine", 2),
  });
};
