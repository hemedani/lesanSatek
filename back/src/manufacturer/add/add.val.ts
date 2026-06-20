import { object } from "lesan";
import { activeRoleMixin } from "@lib";
import { selectStruct } from "../../../mod.ts";
import { manufacturer_pure } from "@model";

export const addValidator = () => {
	return object({
		set: object({
			...activeRoleMixin,
			...manufacturer_pure,
		}),
		get: selectStruct("manufacturer", 1),
	});
};
