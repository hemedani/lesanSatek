import { object, objectIdValidation } from "lesan";
import { activeRoleMixin } from "@lib";
import { selectStruct } from "../../../mod.ts";
import { stuff_pure } from "@model";

export const addValidator = () => {
	return object({
		set: object({
			...activeRoleMixin,
			...stuff_pure,
			wareId: objectIdValidation,
			storeId: objectIdValidation,
			wareTypeId: objectIdValidation,
			wareClassId: objectIdValidation,
			wareGroupId: objectIdValidation,
			wareModelId: objectIdValidation,
		}),
		get: selectStruct("stuff", 1),
	});
};
