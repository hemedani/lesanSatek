import { activeRoleMixin } from "@lib";
import { array, object, objectIdValidation } from "lesan";
import { selectStruct } from "../../../mod.ts";

export const getFilesValidator = () => {
  return object({
    set: object({
      ...activeRoleMixin,
      _ids: array(objectIdValidation),
    }),
    get: selectStruct("file", 2),
  });
};
