import type { ActFn, Document } from "lesan";
import { organization } from "../../../mod.ts";

export const getsFn: ActFn = async (body) => {
	const {
		set: {
			page,
			limit,
			skip,
			search,
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

	const calculatedSkip = skip ?? limit * (page - 1);
	pipeline.push({ $skip: calculatedSkip });
	pipeline.push({ $limit: limit });

	return await organization
		.aggregation({
			pipeline,
			projection: get,
		})
		.toArray();
};
