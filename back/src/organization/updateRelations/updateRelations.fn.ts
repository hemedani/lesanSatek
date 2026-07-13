import { type ActFn, ObjectId } from "lesan";
import { organization } from "../../../mod.ts";

export const updateRelationsFn: ActFn = async (body) => {
	const {
		set: { _id, logo, removeLogo, head, removeHead, state, removeState, city, removeCity },
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

	if (removeState) {
		const currentOrg = await organization.findOne({
			filters: { _id: orgId },
			projection: { state: { _id: 1 } },
		});
		const stateId = currentOrg?.state?._id;
		if (stateId) {
			await organization.removeRelation({
				filters: { _id: orgId },
				relations: {
					state: {
						_ids: stateId,
						relatedRelations: {
							organizations: true,
						},
					},
				},
				projection: get,
			});
		}
	}

	if (state) {
		await organization.addRelation({
			filters: { _id: orgId },
			relations: {
				state: {
					_ids: new ObjectId(state),
					relatedRelations: {
						organizations: true,
					},
				},
			},
			projection: get,
			replace: true,
		});
	}

	if (removeCity) {
		const currentOrg = await organization.findOne({
			filters: { _id: orgId },
			projection: { city: { _id: 1 } },
		});
		const cityId = currentOrg?.city?._id;
		if (cityId) {
			await organization.removeRelation({
				filters: { _id: orgId },
				relations: {
					city: {
						_ids: cityId,
						relatedRelations: {
							organizations: true,
						},
					},
				},
				projection: get,
			});
		}
	}

	if (city) {
		await organization.addRelation({
			filters: { _id: orgId },
			relations: {
				city: {
					_ids: new ObjectId(city),
					relatedRelations: {
						organizations: true,
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
