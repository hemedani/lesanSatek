import type { ActFn, Document } from "lesan";
import { organization } from "../../../mod.ts";

export const countFn: ActFn = async (body) => {
	const {
		set: { search },
		get,
	} = body.details;

	const filters: Document = {};

	search &&
		(filters["$or"] = [
			{ name: { $regex: search, $options: "i" } },
			{ enName: { $regex: search, $options: "i" } },
			{ description: { $regex: search, $options: "i" } },
		]);

	const foundedItemsLength = await organization.countDocument({
		filter: filters,
	});

	return { qty: foundedItemsLength };
};
