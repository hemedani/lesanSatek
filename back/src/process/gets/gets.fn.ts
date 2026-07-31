import type { ActFn, Document } from "lesan";
import { ObjectId } from "lesan";
import { process, coreApp } from "../../../mod.ts";
import type { MyContext } from "@lib";

export const getsFn: ActFn = async (body) => {
	const {
		set: {
			page,
			limit,
			skip,
			search,
			organizationId,
			sortBy,
			sortOrder,
			activeRoleId,
		},
		get,
	} = body.details;

	const { user }: MyContext = coreApp.contextFns.getContextModel() as MyContext;

	const activeRole = (user.roles || []).find(
		(r: { roleId: string }) => r.roleId === activeRoleId,
	) as { name: string; scopeType?: string; scopeId?: string } | undefined;

	const pipeline: Document[] = [];

	if (
		!user.isGhost &&
		!["Manager", "Admin"].includes(activeRole?.name as string) &&
		activeRole?.name === "OrgHead" &&
		activeRole.scopeType === "organization" &&
		activeRole.scopeId
	) {
		pipeline.push({
			$match: { "organization._id": new ObjectId(activeRole.scopeId) },
		});
	}

	search &&
		pipeline.push({
			$match: { $text: { $search: search } },
		});

	organizationId &&
		pipeline.push({
			$match: { "organization._id": new ObjectId(organizationId as string) },
		});

	if (search && (!sortBy || sortBy === "relevance")) {
		pipeline.push({
			$addFields: {
				textScore: { $meta: "textScore" },
			},
		});
	}

	const sortField = sortBy === "relevance" ? "textScore" : (sortBy || "_id");
	const sortDirection = sortOrder === "asc" ? 1 : -1;
	pipeline.push({ $sort: { [sortField]: sortDirection } });

	const calculatedSkip = skip ?? (limit || 50) * ((page || 1) - 1);
	pipeline.push({ $skip: calculatedSkip });
	pipeline.push({ $limit: limit || 50 });

	return await process
		.aggregation({
			pipeline,
			projection: get,
		})
		.toArray();
};
