import { array, boolean, number, object, objectIdValidation, optional, string } from "lesan";
import { selectStruct } from "../../../mod.ts";
import { activeRoleMixin } from "@lib";

export const updateValidator = () => {
	return object({
		set: object({
			...activeRoleMixin,
			_id: objectIdValidation,
			name: optional(string()),
			enName: optional(string()),
			description: optional(string()),
			isActive: optional(boolean()),
			location: optional(object({
				type: string(),
				coordinates: array(number()),
			})),
		}),
		get: selectStruct("organization", 1),
	});
};
