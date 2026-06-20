import { type ActFn, ObjectId } from "lesan";
import { city } from "../../../mod.ts";

export const addFn: ActFn = async (body) => {
	const { set, get } = body.details;

	const { activeRoleId, stateId, ...rest } = set;

	return await city.insertOne({
		doc: rest,
		projection: get,
		relations: {
			state: {
				_ids: new ObjectId(stateId as string),
				relatedRelations: {
					cities: true,
				},
			},
		},
	});
};
