import { enums, object, optional, string } from "lesan";
import { activeRoleMixin } from "@lib";
import { selectStruct } from "../../../mod.ts";
import { pagination } from "@lib";

export const getsValidator = () => {
	return object({
		set: object({
			...activeRoleMixin,
			...pagination,
			search: optional(string()),
			sortBy: optional(enums(["createdAt", "updatedAt", "name"])),
			sortOrder: optional(enums(["asc", "desc"])),
		}),
		get: selectStruct("wareModel", 2),
	});
};
