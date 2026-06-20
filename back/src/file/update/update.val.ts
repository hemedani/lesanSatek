import { activeRoleMixin } from "@lib";
import { enums, number, object, objectIdValidation, optional, string } from "lesan";
import { selectStruct } from "../../../mod.ts";
import { file_type_array } from "../../../models/mod.ts";

export const updateValidator = () => {
  return object({
    set: object({
      ...activeRoleMixin,
      _id: objectIdValidation,
      name: optional(string()),
      mimeType: optional(string()),
      size: optional(number()),
      type: optional(enums(file_type_array)),
      alt_text: optional(string()),
    }),
    get: selectStruct("file", 1),
  });
};
