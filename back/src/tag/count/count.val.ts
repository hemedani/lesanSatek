import { activeRoleMixin } from "@lib";
import { enums, object, optional, string } from "lesan";

export const countValidator = () => {
	return object({
		set: object({
			...activeRoleMixin,
			name: optional(string()),
		}),
		get: object({ qty: optional(enums([0, 1])) }),
	});
};
