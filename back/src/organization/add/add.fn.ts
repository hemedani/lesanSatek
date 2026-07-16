import { type ActFn, ObjectId } from "lesan";
import { organization, user, coreApp } from "../../../mod.ts";
import type { MyContext } from "@lib";

const addOrgHeadRole = async (headUserId: string, orgId: string) => {
  await user.findOneAndUpdate({
    filter: {
      _id: new ObjectId(headUserId),
      roles: { $not: { $elemMatch: { name: "OrgHead", scopeType: "organization", scopeId: orgId } } },
    },
    update: { $push: { roles: { roleId: crypto.randomUUID(), name: "OrgHead", scopeType: "organization", scopeId: orgId } } },
    projection: { _id: 1 },
  });
};

const removeOrgHeadRole = async (headUserId: string, orgId: string) => {
  await user.findOneAndUpdate({
    filter: { _id: new ObjectId(headUserId) },
    update: { $pull: { roles: { name: "OrgHead", scopeType: "organization", scopeId: orgId } } },
    projection: { _id: 1 },
  });
};

export const addFn: ActFn = async (body) => {
	const { set, get } = body.details;
	const { user }: MyContext = coreApp.contextFns
		.getContextModel() as MyContext;

	const { activeRoleId, logoId, headId, state, city, ...rest } = set;

	const relations: Record<string, unknown> = {
		creator: {
			_ids: user._id,
		},
	};

	if (logoId) {
		relations.logo = {
			_ids: new ObjectId(logoId as string),
		};
	}

	if (headId) {
		relations.head = {
			_ids: new ObjectId(headId as string),
			relatedRelations: {
				headedOrganization: true,
			},
		};
	}

	if (state) {
		relations.state = {
			_ids: new ObjectId(state as string),
			relatedRelations: {
				organizations: true,
			},
		};
	}

	if (city) {
		relations.city = {
			_ids: new ObjectId(city as string),
			relatedRelations: {
				organizations: true,
			},
		};
	}

	const createdOrg = await organization.insertOne({
		doc: rest,
		relations,
		projection: { _id: 1 },
	});

	if (!createdOrg) return;

	if (headId) {
		await addOrgHeadRole(headId as string, createdOrg._id.toString());
	}

	return await organization.findOne({
		filters: { _id: createdOrg._id },
		projection: get,
	});
};

export { addOrgHeadRole, removeOrgHeadRole };
