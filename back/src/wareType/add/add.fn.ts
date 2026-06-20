import { type ActFn } from "lesan";
import { wareType, coreApp } from "../../../mod.ts";
import { stripActiveRole } from "@lib";
import type { MyContext } from "@lib";

export const addFn: ActFn = async (body) => {
	const { set, get } = body.details;
	const { user }: MyContext = coreApp.contextFns
		.getContextModel() as MyContext;

	return await wareType.insertOne({
		doc: stripActiveRole(set),
		projection: get,
	});
};
