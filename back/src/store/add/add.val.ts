import { array, object, objectIdValidation, optional } from "lesan";
import { activeRoleMixin } from "@lib";
import { selectStruct } from "../../../mod.ts";
import { store_pure } from "@model";

export const addValidator = () => {
	return object({
		set: object({
			...activeRoleMixin,
			...store_pure,
			storeHeadId: optional(objectIdValidation),
			cityId: optional(objectIdValidation),
			stateId: optional(objectIdValidation),
			wareTypeIds: optional(array(objectIdValidation)),
		}),
		get: selectStruct("store", 1),
	});
};
