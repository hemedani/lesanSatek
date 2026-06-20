import { object } from "lesan";
import { activeRoleMixin } from "@lib";
import { selectStruct } from "../../../mod.ts";
import { wareType_pure } from "@model";

export const addValidator = () => {
	return object({
		set: object({
			...activeRoleMixin,
			...wareType_pure,
		}),
		get: selectStruct("wareType", 1),
	});
};
