import { type ActFn, ObjectId } from "lesan";
import { wareGroup } from "../../../mod.ts";

export const addFn: ActFn = async (body) => {
	const { set, get } = body.details;

	const { activeRoleId, wareTypeId, wareClassIds, ...rest } = set;

	const relations: Record<string, unknown> = {
		wareType: {
			_ids: new ObjectId(wareTypeId as string),
			relatedRelations: {
				wareGroups: true,
			},
		},
	};

	if (wareClassIds) {
		relations.wareClasses = {
			_ids: (wareClassIds as string[]).map((id: string) => new ObjectId(id)),
			relatedRelations: {
				wareGroups: true,
			},
		};
	}

	return await wareGroup.insertOne({
		doc: rest,
		relations,
		projection: get,
	});
};
