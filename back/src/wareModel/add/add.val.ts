import { object, objectIdValidation } from "lesan";
import { activeRoleMixin } from "@lib";
import { selectStruct } from "../../../mod.ts";
import { wareModel_pure } from "@model";

export const addValidator = () => {
	return object({
		set: object({
			...activeRoleMixin,
			...wareModel_pure,
			wareTypeId: objectIdValidation,
			wareClassId: objectIdValidation,
			wareGroupId: objectIdValidation,
		}),
		get: selectStruct("wareModel", 1),
	});
};
