import { object, objectIdValidation } from "lesan";
import { activeRoleMixin } from "@lib";
import { selectStruct } from "../../../mod.ts";
import { wareClass_pure } from "@model";

export const addValidator = () => {
	return object({
		set: object({
			...activeRoleMixin,
			...wareClass_pure,
			wareTypeId: objectIdValidation,
		}),
		get: selectStruct("wareClass", 1),
	});
};
