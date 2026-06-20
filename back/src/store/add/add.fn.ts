import { type ActFn, ObjectId } from "lesan";
import { store } from "../../../mod.ts";

export const addFn: ActFn = async (body) => {
	const { set, get } = body.details;

	const { activeRoleId, storeHeadId, cityId, stateId, wareTypeIds, ...rest } = set;

	const relations: Record<string, unknown> = {};

	if (storeHeadId) {
		relations.storeHead = {
			_ids: new ObjectId(storeHeadId as string),
			relatedRelations: { managedStore: true },
		};
	}

	if (cityId) {
		relations.city = {
			_ids: new ObjectId(cityId as string),
			relatedRelations: { stores: true },
		};
	}

	if (stateId) {
		relations.state = {
			_ids: new ObjectId(stateId as string),
			relatedRelations: { stores: true },
		};
	}

	if (wareTypeIds) {
		relations.wareTypes = {
			_ids: (wareTypeIds as string[]).map((id: string) => new ObjectId(id)),
			relatedRelations: { stores: true },
		};
	}

	return await store.insertOne({
		doc: rest,
		relations,
		projection: get,
	});
};
