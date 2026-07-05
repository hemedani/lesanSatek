import { type ActFn, ObjectId } from "lesan";
import { wareModel, coreApp } from "../../../mod.ts";
import type { MyContext } from "@lib";

export const addFn: ActFn = async (body) => {
	const { set, get } = body.details;
	const { user }: MyContext = coreApp.contextFns.getContextModel() as MyContext;

	const { activeRoleId, wareTypeId, wareClassId, wareGroupId, ...rest } = set;

	return await wareModel.insertOne({
		doc: rest,
		projection: get,
		relations: {
			creator: {
				_ids: user._id,
				relatedRelations: {},
			},
			wareType: {
				_ids: new ObjectId(wareTypeId as string),
				relatedRelations: { wareModels: true },
			},
			wareClass: {
				_ids: new ObjectId(wareClassId as string),
				relatedRelations: { wareModels: true },
			},
			wareGroup: {
				_ids: new ObjectId(wareGroupId as string),
				relatedRelations: { wareModels: true },
			},
		},
	});
};
