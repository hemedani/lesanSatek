import { object, objectIdValidation, optional } from "lesan";
import { activeRoleMixin } from "@lib";
import { selectStruct } from "../../../mod.ts";
import { ware_pure } from "@model";

export const addValidator = () => {
	return object({
		set: object({
			...activeRoleMixin,
			...ware_pure,
			manufacturerId: optional(objectIdValidation),
			wareTypeId: objectIdValidation,
			wareClassId: objectIdValidation,
			wareGroupId: objectIdValidation,
			wareModelId: objectIdValidation,
		}),
		get: selectStruct("ware", 1),
	});
};
