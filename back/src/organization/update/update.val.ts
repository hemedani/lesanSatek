import { boolean, object, objectIdValidation, optional, string } from "lesan";
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
		}),
		get: selectStruct("organization", 1),
	});
};
