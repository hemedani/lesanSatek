import { activeRoleMixin } from "@lib";
import { object } from "lesan";
import { selectStruct } from "../../../mod.ts";
import { tag_pure } from "@model";

export const addValidator = () => {
	return object({
		set: object({
			...activeRoleMixin,
			...tag_pure,
		}),
		get: selectStruct("tag", 1),
	});
};
