import type { ActFn, Document } from "lesan";
import { ObjectId } from "lesan";
import { wareClass } from "../../../mod.ts";

export const getsFn: ActFn = async (body) => {
	const {
		set: { page, limit, skip, search, sortBy, sortOrder, wareTypeId },
		get,
	} = body.details;

	const pipeline: Document[] = [];

	search &&
		pipeline.push({
			$match: { $text: { $search: search } },
		});

	wareTypeId &&
		pipeline.push({
			$match: { "wareType._id": new ObjectId(wareTypeId as string) },
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

	return await wareClass
		.aggregation({ pipeline, projection: get })
		.toArray();
};
