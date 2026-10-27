import { boolean, object, objectIdValidation, optional } from "lesan";
import { activeRoleMixin } from "@lib";
import { selectStruct } from "../../../mod.ts";
import { account_pure } from "../../../models/account.ts";

export const updateValidator = () => {
  const updatePure: Record<string, unknown> = { ...account_pure };
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
      isPostable: optional(boolean()),
      isActive: optional(boolean()),
      isSystem: optional(boolean()),
    }),
    get: selectStruct("account", 2),
  });
};
