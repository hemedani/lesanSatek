import { type ActFn, ObjectId } from "lesan";
import { wareModel } from "../../../mod.ts";

export const addFn: ActFn = async (body) => {
	const { set, get } = body.details;

	const { activeRoleId, wareTypeId, wareClassId, wareGroupId, ...rest } = set;

	return await wareModel.insertOne({
		doc: rest,
		projection: get,
		relations: {
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
