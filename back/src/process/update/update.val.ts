import { boolean, number, object, objectIdValidation, optional, string } from "lesan";
import { selectStruct } from "../../../mod.ts";
import { process_status_emums } from "@model";
import { activeRoleMixin } from "@lib";

export const updateValidator = () => {
	return object({
		set: object({
			...activeRoleMixin,
			_id: objectIdValidation,
			name: optional(string()),
			description: optional(string()),
			status: optional(process_status_emums),
			version: optional(number()),
			isActive: optional(boolean()),
		}),
		get: selectStruct("process", 1),
	});
};
