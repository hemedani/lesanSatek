import { type ActFn, ObjectId } from "lesan";
import { process, coreApp } from "../../../mod.ts";
import type { MyContext } from "@lib";

export const addFn: ActFn = async (body) => {
	const { set, get } = body.details;
	const { user }: MyContext = coreApp.contextFns.getContextModel() as MyContext;

	const { activeRoleId, organizationId, unitId, wareId, wareModelId, wareGroupId, wareClassId, wareTypeId, ...rest } = set;

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

	if (unitId) {
		relations.unit = {
			_ids: new ObjectId(unitId as string),
		};
	}
	if (wareId) {
		relations.ware = {
			_ids: new ObjectId(wareId as string),
		};
	}
	if (wareModelId) {
		relations.wareModel = {
			_ids: new ObjectId(wareModelId as string),
		};
	}
	if (wareGroupId) {
		relations.wareGroup = {
			_ids: new ObjectId(wareGroupId as string),
		};
	}
	if (wareClassId) {
		relations.wareClass = {
			_ids: new ObjectId(wareClassId as string),
		};
	}
	if (wareTypeId) {
		relations.wareType = {
			_ids: new ObjectId(wareTypeId as string),
		};
	}

	return await process.insertOne({
		doc: rest,
		relations,
		projection: get,
	});
};
