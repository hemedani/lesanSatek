import { object, objectIdValidation, optional } from "lesan";
import { activeRoleMixin } from "@lib";
import { selectStruct } from "../../../mod.ts";

export const updateRelationsValidator = () => {
	return object({
		set: object({
			...activeRoleMixin,
			_id: objectIdValidation,
		}),
		get: selectStruct("city", 2),
	});
};
