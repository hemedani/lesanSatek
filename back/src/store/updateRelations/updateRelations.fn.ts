import { type ActFn, ObjectId } from "lesan";
import { store } from "../../../mod.ts";

export const updateRelationsFn: ActFn = async (body) => {
	const {
		set: { _id, ...relations },
		get,
	} = body.details;

	const modelId = new ObjectId(_id);

	for (const [key, value] of Object.entries(relations)) {
		if (value) {
			await store.addRelation({
				filters: { _id: modelId },
				relations: {
					[key]: {
						_ids: new ObjectId(value as string),
						relatedRelations: {},
					},
				},
				projection: get,
				replace: true,
			});
		}
	}

	return await store.findOne({
		filters: { _id: modelId },
		projection: get,
	});
};
