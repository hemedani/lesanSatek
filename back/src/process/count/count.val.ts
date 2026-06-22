import { enums, object, objectIdValidation, optional, string } from "lesan";
import { activeRoleMixin } from "@lib";

export const countValidator = () => {
	return object({
		set: object({
			...activeRoleMixin,
			name: optional(string()),
			organizationId: optional(objectIdValidation),
		}),
		get: object({ qty: optional(enums([0, 1])) }),
	});
};
