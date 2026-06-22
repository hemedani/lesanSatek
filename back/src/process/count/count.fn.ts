import type { ActFn, Document } from "lesan";
import { ObjectId } from "lesan";
import { process } from "../../../mod.ts";

export const countFn: ActFn = async (body) => {
	const {
		set: { name, organizationId },
		get,
	} = body.details;

	const filters: Document = {};

	name &&
		(filters["name"] = {
			$regex: new RegExp(name, "i"),
		});

	organizationId &&
		(filters["organization._id"] = new ObjectId(organizationId as string));

	const foundedItemsLength = await process.countDocument({
		filter: filters,
	});

	return { qty: foundedItemsLength };
};
