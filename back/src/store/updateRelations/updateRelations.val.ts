import { array, object, objectIdValidation, optional } from "lesan";
import { activeRoleMixin } from "@lib";
import { selectStruct } from "../../../mod.ts";

export const updateRelationsValidator = () => {
	return object({
		set: object({
			...activeRoleMixin,
			_id: objectIdValidation,
			storeHeadId: optional(objectIdValidation),
			cityId: optional(objectIdValidation),
			stateId: optional(objectIdValidation),
			wareTypeIds: optional(array(objectIdValidation)),
		}),
		get: selectStruct("store", 2),
	});
};
