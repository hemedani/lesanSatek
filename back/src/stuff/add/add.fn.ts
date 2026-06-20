import { type ActFn, ObjectId } from "lesan";
import { stuff } from "../../../mod.ts";

export const addFn: ActFn = async (body) => {
	const { set, get } = body.details;

	const { activeRoleId, wareId, storeId, wareTypeId, wareClassId, wareGroupId, wareModelId, ...rest } = set;

	return await stuff.insertOne({
		doc: rest,
		projection: get,
		relations: {
			ware: {
				_ids: new ObjectId(wareId as string),
				relatedRelations: { stuffs: true },
			},
			store: {
				_ids: new ObjectId(storeId as string),
				relatedRelations: { stuffs: true },
			},
			wareType: {
				_ids: new ObjectId(wareTypeId as string),
				relatedRelations: { stuffs: true },
			},
			wareClass: {
				_ids: new ObjectId(wareClassId as string),
				relatedRelations: { stuffs: true },
			},
			wareGroup: {
				_ids: new ObjectId(wareGroupId as string),
				relatedRelations: { stuffs: true },
			},
			wareModel: {
				_ids: new ObjectId(wareModelId as string),
				relatedRelations: { stuffs: true },
			},
		},
	});
};
