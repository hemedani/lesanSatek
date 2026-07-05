import { type ActFn, ObjectId } from "lesan";
import { wareGroup, coreApp } from "../../../mod.ts";
import type { MyContext } from "@lib";

export const addFn: ActFn = async (body) => {
	const { set, get } = body.details;
	const { user }: MyContext = coreApp.contextFns.getContextModel() as MyContext;

	const { activeRoleId, wareTypeId, wareClassIds, ...rest } = set;

	const relations: Record<string, unknown> = {
		creator: {
			_ids: user._id,
			relatedRelations: {},
		},
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
