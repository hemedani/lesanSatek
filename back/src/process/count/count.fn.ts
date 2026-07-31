import type { ActFn, Document } from "lesan";
import { ObjectId } from "lesan";
import { process, coreApp } from "../../../mod.ts";
import type { MyContext } from "@lib";

export const countFn: ActFn = async (body) => {
	const {
		set: {
			name,
			status,
			organizationId,
			activeRoleId,
			unitId,
			wareId,
			wareModelId,
			wareGroupId,
			wareClassId,
			wareTypeId,
		},
		get,
	} = body.details;

	const { user }: MyContext = coreApp.contextFns.getContextModel() as MyContext;

	const activeRole = (user.roles || []).find(
		(r: { roleId: string }) => r.roleId === activeRoleId,
	) as { name: string; scopeType?: string; scopeId?: string } | undefined;

	const filters: Document = {};

	if (
		!user.isGhost &&
		!["Manager", "Admin"].includes(activeRole?.name as string) &&
		activeRole?.name === "OrgHead" &&
		activeRole.scopeType === "organization" &&
		activeRole.scopeId
	) {
		filters["organization._id"] = new ObjectId(activeRole.scopeId);
	}

	name &&
		(filters["name"] = {
			$regex: new RegExp(name, "i"),
		});

	status && (filters["status"] = status as string);

	organizationId &&
		(filters["organization._id"] = new ObjectId(organizationId as string));

	unitId && (filters["unit._id"] = new ObjectId(unitId as string));
	wareId && (filters["ware._id"] = new ObjectId(wareId as string));
	wareModelId && (filters["wareModel._id"] = new ObjectId(wareModelId as string));
	wareGroupId && (filters["wareGroup._id"] = new ObjectId(wareGroupId as string));
	wareClassId && (filters["wareClass._id"] = new ObjectId(wareClassId as string));
	wareTypeId && (filters["wareType._id"] = new ObjectId(wareTypeId as string));

	const foundedItemsLength = await process.countDocument({
		filter: filters,
	});

	return { qty: foundedItemsLength };
};
