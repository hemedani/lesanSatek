import { boolean, object, objectIdValidation, optional } from "lesan";
import { selectStruct } from "../../../mod.ts";
import { activeRoleMixin } from "@lib";

export const updateRelationsValidator = () => {
	return object({
		set: object({
			...activeRoleMixin,
			_id: objectIdValidation,
			logo: optional(objectIdValidation),
			removeLogo: optional(boolean()),
			head: optional(objectIdValidation),
			removeHead: optional(boolean()),
			state: optional(objectIdValidation),
			removeState: optional(boolean()),
			city: optional(objectIdValidation),
			removeCity: optional(boolean()),
		}),
		get: selectStruct("organization", 2),
	});
};
