import { type ActFn, ObjectId } from "lesan";
import { store } from "../../../mod.ts";

export const updateRelationsFn: ActFn = async (body) => {
	const {
		set: { _id, storeHeadId, cityId, stateId, wareTypeIds },
		get,
	} = body.details;

	const modelId = new ObjectId(_id);

	if (storeHeadId !== undefined) {
		await store.addRelation({
			filters: { _id: modelId },
			relations: {
				storeHead: {
					_ids: new ObjectId(storeHeadId as string),
					relatedRelations: { managedStore: true },
				},
			},
			projection: get,
			replace: true,
		});
	}

	if (cityId !== undefined) {
		await store.addRelation({
			filters: { _id: modelId },
			relations: {
				city: {
					_ids: new ObjectId(cityId as string),
					relatedRelations: { stores: true },
				},
			},
			projection: get,
			replace: true,
		});
	}

	if (stateId !== undefined) {
		await store.addRelation({
			filters: { _id: modelId },
			relations: {
				state: {
					_ids: new ObjectId(stateId as string),
					relatedRelations: { stores: true },
				},
			},
			projection: get,
			replace: true,
		});
	}

	if (wareTypeIds !== undefined) {
		await store.addRelation({
			filters: { _id: modelId },
			relations: {
				wareTypes: {
					_ids: (wareTypeIds as string[]).map((id: string) => new ObjectId(id)),
					relatedRelations: { stores: true },
				},
			},
			projection: get,
			replace: true,
		});
	}

	return await store.findOne({
		filters: { _id: modelId },
		projection: get,
	});
};
