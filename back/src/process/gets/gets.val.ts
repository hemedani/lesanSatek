import { enums, object, objectIdValidation, optional, string } from "lesan";
import { selectStruct } from "../../../mod.ts";
import { pagination, activeRoleMixin } from "@lib";

export const getsValidator = () => {
	return object({
		set: object({
			...activeRoleMixin,
			...pagination,
			search: optional(string()),
			organizationId: optional(objectIdValidation),
			sortBy: optional(enums(["name", "status", "version", "isActive", "createdAt", "updatedAt"])),
			sortOrder: optional(enums(["asc", "desc"])),
		}),
		get: selectStruct("process", 2),
	});
};
