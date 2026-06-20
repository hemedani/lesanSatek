import { type ActFn, ObjectId } from "lesan";
import { wareClass } from "../../../mod.ts";

export const addFn: ActFn = async (body) => {
	const { set, get } = body.details;

	const { activeRoleId, wareTypeId, ...rest } = set;

	return await wareClass.insertOne({
		doc: rest,
		projection: get,
		relations: {
			wareType: {
				_ids: new ObjectId(wareTypeId as string),
				relatedRelations: {
					wareClasses: true,
				},
			},
		},
	});
};
