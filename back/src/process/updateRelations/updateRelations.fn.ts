import { type ActFn, ObjectId } from "lesan";
import { process } from "../../../mod.ts";

const scopeRelations = [
  "unit", "ware", "wareModel", "wareGroup", "wareClass", "wareType",
] as const;

export const updateRelationsFn: ActFn = async (body) => {
	const {
		set: { _id, organizationId, unitId, wareId, wareModelId, wareGroupId, wareClassId, wareTypeId },
		get,
	} = body.details;

	const processId = new ObjectId(_id as string);

	if (organizationId) {
		await process.addRelation({
			filters: { _id: processId },
			relations: {
				organization: {
					_ids: new ObjectId(organizationId as string),
					relatedRelations: {
						processes: true,
					},
				},
			},
			projection: get,
			replace: true,
		});
	}

	const scopeMap: Record<string, string | undefined> = {
		unit: unitId as string | undefined,
		ware: wareId as string | undefined,
		wareModel: wareModelId as string | undefined,
		wareGroup: wareGroupId as string | undefined,
		wareClass: wareClassId as string | undefined,
		wareType: wareTypeId as string | undefined,
	};

	for (const relationName of scopeRelations) {
		const id = scopeMap[relationName];
		if (id) {
			await process.addRelation({
				filters: { _id: processId },
				relations: {
					[relationName]: {
						_ids: new ObjectId(id as string),
					},
				},
				projection: { _id: 1 },
				replace: true,
			});
		}
	}

	return await process.findOne({
		filters: { _id: processId },
		projection: get,
	});
};
