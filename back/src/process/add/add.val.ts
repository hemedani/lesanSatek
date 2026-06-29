import { object, objectIdValidation, optional } from "lesan";
import { selectStruct } from "../../../mod.ts";
import { process_pure } from "@model";
import { activeRoleMixin } from "@lib";

export const addValidator = () => {
	return object({
		set: object({
			...activeRoleMixin,
			...process_pure,
			organizationId: objectIdValidation,
		}),
		get: selectStruct("process", 1),
	});
};
