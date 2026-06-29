import { type ActFn, ObjectId } from "lesan";
import { process, coreApp } from "../../../mod.ts";
import type { MyContext } from "@lib";

export const addFn: ActFn = async (body) => {
	const { set, get } = body.details;
	const { user }: MyContext = coreApp.contextFns.getContextModel() as MyContext;

	const { activeRoleId, organizationId, ...rest } = set;

	const relations: Record<string, unknown> = {
		organization: {
			_ids: new ObjectId(organizationId as string),
			relatedRelations: {
				processes: true,
			},
		},
		createdBy: {
			_ids: user._id,
			relatedRelations: {
				createdProcesses: true,
			},
		},
	};

	return await process.insertOne({
		doc: rest,
		relations,
		projection: get,
	});
};
