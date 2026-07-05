import { type ActFn, ObjectId } from "lesan";
import { wareClass, coreApp } from "../../../mod.ts";
import type { MyContext } from "@lib";

export const addFn: ActFn = async (body) => {
	const { set, get } = body.details;
	const { user }: MyContext = coreApp.contextFns.getContextModel() as MyContext;

	const { activeRoleId, wareTypeId, ...rest } = set;

	return await wareClass.insertOne({
		doc: rest,
		projection: get,
		relations: {
			creator: {
				_ids: user._id,
				relatedRelations: {},
			},
			wareType: {
				_ids: new ObjectId(wareTypeId as string),
				relatedRelations: {
					wareClasses: true,
				},
			},
		},
	});
};
