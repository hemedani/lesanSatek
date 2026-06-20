import { enums, object, optional, string } from "lesan";
import { activeRoleMixin } from "@lib";

export const countValidator = () => {
	return object({
		set: object({
			...activeRoleMixin,
			name: optional(string()),
		}),
		get: object({ qty: optional(enums([0, 1])) }),
	});
};
