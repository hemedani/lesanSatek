import { object, objectIdValidation, optional } from "lesan";
import { selectStruct } from "../../../mod.ts";
import { organization_pure } from "@model";
import { activeRoleMixin } from "@lib";

export const addValidator = () => {
	return object({
		set: object({
			...activeRoleMixin,
			...organization_pure,
			logoId: optional(objectIdValidation),
			headId: optional(objectIdValidation),
		}),
		get: selectStruct("organization", 1),
	});
};
