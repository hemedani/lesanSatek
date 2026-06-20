import { type ActFn } from "lesan";
import { tag, coreApp } from "../../../mod.ts";
import type { MyContext } from "@lib";

export const addFn: ActFn = async (body) => {
	const { set, get } = body.details;
	const { user }: MyContext = coreApp.contextFns
		.getContextModel() as MyContext;

	const { activeRoleId, ...rest } = set;

	return await tag.insertOne({
		doc: rest,
		relations: {
			registrar: {
				_ids: user._id,
			},
		},
		projection: get,
	});
};
