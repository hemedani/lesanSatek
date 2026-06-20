import { activeRoleMixin } from "@lib";
import { boolean, enums, object, objectIdValidation, optional } from "lesan";

export const removeValidator = () => {
	return object({
		set: object({
			...activeRoleMixin,
			_id: objectIdValidation,
			hardCascade: optional(boolean()),
		}),
		get: object({
			success: optional(enums([0, 1])),
		}),
	});
};
