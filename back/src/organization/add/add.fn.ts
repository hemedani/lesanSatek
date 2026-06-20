import { type ActFn, ObjectId } from "lesan";
import { organization, coreApp } from "../../../mod.ts";
import type { MyContext } from "@lib";

export const addFn: ActFn = async (body) => {
	const { set, get } = body.details;
	const { user }: MyContext = coreApp.contextFns
		.getContextModel() as MyContext;

	const { activeRoleId, logoId, headId, ...rest } = set;

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

	return await organization.insertOne({
		doc: rest,
		relations,
		projection: get,
	});
};
