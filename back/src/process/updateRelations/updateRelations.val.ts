import { object, objectIdValidation, optional } from "lesan";
import { selectStruct } from "../../../mod.ts";
import { activeRoleMixin } from "@lib";

export const updateRelationsValidator = () => {
	return object({
		set: object({
			...activeRoleMixin,
			_id: objectIdValidation,
			organizationId: optional(objectIdValidation),
			unitId: optional(objectIdValidation),
			wareId: optional(objectIdValidation),
			wareModelId: optional(objectIdValidation),
			wareGroupId: optional(objectIdValidation),
			wareClassId: optional(objectIdValidation),
			wareTypeId: optional(objectIdValidation),
		}),
		get: selectStruct("process", 2),
	});
};
