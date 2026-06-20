import { array, object, objectIdValidation, optional } from "lesan";
import { activeRoleMixin } from "@lib";
import { selectStruct } from "../../../mod.ts";

export const updateRelationsValidator = () => {
	return object({
		set: object({
			...activeRoleMixin,
			_id: objectIdValidation,
			wareTypeId: optional(objectIdValidation),
			wareClassIds: optional(array(objectIdValidation)),
		}),
		get: selectStruct("wareGroup", 2),
	});
};
