import { array, boolean, coerce, enums, number, object, objectIdValidation, optional, string } from "lesan";
import { selectStruct } from "../../../mod.ts";
import { group_operator_array, step_type_array } from "../../../models/processStep.ts";
import { activeRoleMixin } from "@lib";

const assigneeGroupValidator = () =>
  object({
    operator: coerce(
      enums(group_operator_array),
      enums(group_operator_array),
      (value) => value as typeof group_operator_array[number],
    ),
    unitIds: array(string()),
  });

export const updateValidator = () => {
  return object({
    set: object({
      ...activeRoleMixin,
      _id: objectIdValidation,
      name: optional(string()),
      description: optional(string()),
      stepType: optional(enums(step_type_array)),
      order: optional(number()),
      required: optional(boolean()),
      groupsOperator: optional(coerce(
        enums(group_operator_array),
        enums(group_operator_array),
        (value) => value as typeof group_operator_array[number],
      )),
      assigneeGroups: optional(array(assigneeGroupValidator())),
    }),
    get: selectStruct("processStep", 1),
  });
};
