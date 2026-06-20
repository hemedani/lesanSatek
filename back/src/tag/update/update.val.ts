import { activeRoleMixin } from "@lib";
import { object, objectIdValidation, optional, string } from "lesan";
import { selectStruct } from "../../../mod.ts";

export const updateValidator = () => {
	return object({
		set: object({
			...activeRoleMixin,
			_id: objectIdValidation,
			name: optional(string()),
			description: optional(string()),
			color: optional(string()),
			icon: optional(string()),
		}),
		get: selectStruct("tag", 1),
	});
};
