import { object, objectIdValidation, optional } from "lesan";
import { activeRoleMixin } from "@lib";
import { selectStruct } from "../../../mod.ts";

export const updateRelationsValidator = () => {
	return object({
		set: object({
			...activeRoleMixin,
			_id: objectIdValidation,
			manufacturerId: optional(objectIdValidation),
			wareTypeId: optional(objectIdValidation),
			wareClassId: optional(objectIdValidation),
			wareGroupId: optional(objectIdValidation),
			wareModelId: optional(objectIdValidation),
		}),
		get: selectStruct("ware", 2),
	});
};
