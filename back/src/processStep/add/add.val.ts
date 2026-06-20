import { array, boolean, coerce, defaulted, enums, number, object, objectIdValidation, optional, string } from "lesan";
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

export const addValidator = () => {
  return object({
    set: object({
      ...activeRoleMixin,
      name: string(),
      description: optional(string()),
      stepType: optional(enums(step_type_array)),
      order: number(),
      required: defaulted(boolean(), true),
      groupsOperator: coerce(
        enums(group_operator_array),
        enums(group_operator_array),
        (value) => value as typeof group_operator_array[number],
      ),
      assigneeGroups: defaulted(array(assigneeGroupValidator()), []),
      processId: objectIdValidation,
    }),
    get: selectStruct("processStep", 1),
  });
};
