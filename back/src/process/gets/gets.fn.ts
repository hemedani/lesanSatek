import type { ActFn, Document } from "lesan";
import { ObjectId } from "lesan";
import { process } from "../../../mod.ts";

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
		},
		get,
	} = body.details;

	const pipeline: Document[] = [];

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
