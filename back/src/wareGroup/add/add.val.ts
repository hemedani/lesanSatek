import { array, object, objectIdValidation, optional } from "lesan";
import { activeRoleMixin } from "@lib";
import { selectStruct } from "../../../mod.ts";
import { wareGroup_pure } from "@model";

export const addValidator = () => {
	return object({
		set: object({
			...activeRoleMixin,
			...wareGroup_pure,
			wareTypeId: objectIdValidation,
			wareClassIds: optional(array(objectIdValidation)),
		}),
		get: selectStruct("wareGroup", 1),
	});
};
