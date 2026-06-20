import { type ActFn, ObjectId } from "lesan";
import { wareGroup } from "../../../mod.ts";

export const updateRelationsFn: ActFn = async (body) => {
	const {
		set: { _id, wareTypeId, wareClassIds },
		get,
	} = body.details;

	const modelId = new ObjectId(_id);

	if (wareTypeId !== undefined) {
		await wareGroup.addRelation({
			filters: { _id: modelId },
			relations: {
				wareType: {
					_ids: new ObjectId(wareTypeId as string),
					relatedRelations: {
						wareGroups: true,
					},
				},
			},
			projection: get,
			replace: true,
		});
	}

	if (wareClassIds !== undefined) {
		await wareGroup.addRelation({
			filters: { _id: modelId },
			relations: {
				wareClasses: {
					_ids: (wareClassIds as string[]).map((id: string) => new ObjectId(id)),
					relatedRelations: {
						wareGroups: true,
					},
				},
			},
			projection: get,
			replace: true,
		});
	}

	return await wareGroup.findOne({
		filters: { _id: modelId },
		projection: get,
	});
};
