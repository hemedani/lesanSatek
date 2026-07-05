import { type ActFn, ObjectId } from "lesan";
import { ware, coreApp } from "../../../mod.ts";
import type { MyContext } from "@lib";

export const addFn: ActFn = async (body) => {
	const { set, get } = body.details;
	const { user }: MyContext = coreApp.contextFns.getContextModel() as MyContext;

	const { activeRoleId, manufacturerId, wareTypeId, wareClassId, wareGroupId, wareModelId, ...rest } = set;

	const relations: Record<string, unknown> = {
		creator: {
			_ids: user._id,
			relatedRelations: {},
		},
		wareType: {
			_ids: new ObjectId(wareTypeId as string),
			relatedRelations: { wares: true },
		},
		wareClass: {
			_ids: new ObjectId(wareClassId as string),
			relatedRelations: { wares: true },
		},
		wareGroup: {
			_ids: new ObjectId(wareGroupId as string),
			relatedRelations: { wares: true },
		},
		wareModel: {
			_ids: new ObjectId(wareModelId as string),
			relatedRelations: { wares: true },
		},
	};

	if (manufacturerId) {
		relations.manufacturer = {
			_ids: new ObjectId(manufacturerId as string),
			relatedRelations: { wares: true },
		};
	}

	return await ware.insertOne({
		doc: rest,
		relations,
		projection: get,
	});
};
