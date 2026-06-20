import { array, object, objectIdValidation, optional } from "lesan";
import { selectStruct } from "../../../mod.ts";
import { activeRoleMixin } from "@lib";

export const updateRelationsValidator = () => {
	return object({
		set: object({
			...activeRoleMixin,
			_id: objectIdValidation,
			organizationId: optional(objectIdValidation),
			assignedUnitIds: optional(array(objectIdValidation)),
		}),
		get: selectStruct("process", 2),
	});
};
