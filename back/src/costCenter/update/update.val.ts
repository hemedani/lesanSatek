import { object, objectIdValidation, optional } from "lesan";
import { activeRoleMixin } from "@lib";
import { selectStruct } from "../../../mod.ts";
import { costCenter_pure } from "../../../models/costCenter.ts";

export const updateValidator = () => {
  const updatePure: Record<string, unknown> = { ...costCenter_pure };
  delete updatePure.createdAt;
  delete updatePure.updatedAt;
  const optionalPure = Object.fromEntries(
    Object.entries(updatePure).map((
      [key, val],
    ) => [key, optional(val as never)]),
  );

  return object({
    set: object({
      ...activeRoleMixin,
      _id: objectIdValidation,
      ...optionalPure,
    }),
    get: selectStruct("costCenter", 2),
  });
};
