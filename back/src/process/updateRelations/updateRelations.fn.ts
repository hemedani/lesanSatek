import { type ActFn, ObjectId } from "lesan";
import { process } from "../../../mod.ts";

export const updateRelationsFn: ActFn = async (body) => {
	const {
		set: { _id, organizationId, assignedUnitIds },
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

	if (assignedUnitIds) {
		await process.addRelation({
			filters: { _id: processId },
			relations: {
				assignedUnits: {
					_ids: (assignedUnitIds as string[]).map((id: string) => new ObjectId(id)),
					relatedRelations: {
						assignedProcesses: true,
					},
				},
			},
			projection: get,
			replace: true,
		});
	}

	return await process.findOne({
		filters: { _id: processId },
		projection: get,
	});
};
