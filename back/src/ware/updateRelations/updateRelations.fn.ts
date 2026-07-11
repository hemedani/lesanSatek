import { type ActFn, ObjectId } from "lesan";
import { ware } from "../../../mod.ts";

export const updateRelationsFn: ActFn = async (body) => {
	const {
		set: { _id, activeRoleId, ...relations },
		get,
	} = body.details;

	const modelId = new ObjectId(_id);

	for (const [key, value] of Object.entries(relations)) {
		if (value) {
			const relationKey = key.endsWith("Id") ? key.slice(0, -2) : key;
			await ware.addRelation({
				filters: { _id: modelId },
				relations: {
					[relationKey]: {
						_ids: new ObjectId(value as string),
						relatedRelations: {},
					},
				},
				projection: get,
				replace: true,
			});
		}
	}

	return await ware.findOne({
		filters: { _id: modelId },
		projection: get,
	});
};
