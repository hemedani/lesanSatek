import { enums, object, objectIdValidation, optional, string } from "lesan";
import { activeRoleMixin } from "@lib";

export const countValidator = () => {
	return object({
		set: object({
			...activeRoleMixin,
			name: optional(string()),
			status: optional(enums(["Draft", "Active", "Archived"])),
			organizationId: optional(objectIdValidation),
			unitId: optional(objectIdValidation),
			wareId: optional(objectIdValidation),
			wareModelId: optional(objectIdValidation),
			wareGroupId: optional(objectIdValidation),
			wareClassId: optional(objectIdValidation),
			wareTypeId: optional(objectIdValidation),
		}),
		get: object({ qty: optional(enums([0, 1])) }),
	});
};
