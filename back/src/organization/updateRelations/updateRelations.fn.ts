import { type ActFn, ObjectId } from "lesan";
import { organization } from "../../../mod.ts";

export const updateRelationsFn: ActFn = async (body) => {
	const {
		set: { _id, logo, removeLogo, head, removeHead },
		get,
	} = body.details;

	const orgId = new ObjectId(_id);

	if (removeLogo) {
		await organization.removeRelation({
			filters: { _id: orgId },
			relations: {
				logo: {
					_ids: orgId,
					relatedRelations: {},
				},
			},
			projection: get,
		});
	}

	if (logo) {
		await organization.addRelation({
			filters: { _id: orgId },
			relations: {
				logo: {
					_ids: new ObjectId(logo),
					relatedRelations: {},
				},
			},
			projection: get,
			replace: true,
		});
	}

	if (removeHead) {
		await organization.removeRelation({
			filters: { _id: orgId },
			relations: {
				head: {
					_ids: orgId,
					relatedRelations: {
						headedOrganization: true,
					},
				},
			},
			projection: get,
		});
	}

	if (head) {
		await organization.addRelation({
			filters: { _id: orgId },
			relations: {
				head: {
					_ids: new ObjectId(head),
					relatedRelations: {
						headedOrganization: true,
					},
				},
			},
			projection: get,
			replace: true,
		});
	}

	return await organization.findOne({
		filters: { _id: orgId },
		projection: get,
	});
};
