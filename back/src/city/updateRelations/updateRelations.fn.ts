import { type ActFn, ObjectId } from "lesan";
import { city } from "../../../mod.ts";

export const updateRelationsFn: ActFn = async (body) => {
	const {
		set: { _id, stateId },
		get,
	} = body.details;

	const modelId = new ObjectId(_id);

	if (stateId !== undefined) {
		await city.addRelation({
			filters: { _id: modelId },
			relations: {
				state: {
					_ids: new ObjectId(stateId as string),
					relatedRelations: {
						cities: true,
					},
				},
			},
			projection: get,
			replace: true,
		});
	}

	return await city.findOne({
		filters: { _id: modelId },
		projection: get,
	});
};
