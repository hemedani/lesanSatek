import { type ActFn, ObjectId } from "lesan";
import { process } from "../../../mod.ts";

export const updateFn: ActFn = async (body) => {
	const {
		set: { _id, name, description, status, version, isActive },
		get,
	} = body.details;

	const updateObj: Record<string, any> = {
		updatedAt: new Date(),
	};

	name && (updateObj.name = name);
	description && (updateObj.description = description);
	status && (updateObj.status = status);
	version !== undefined && (updateObj.version = version);
	isActive !== undefined && (updateObj.isActive = isActive);

	return await process.findOneAndUpdate({
		filter: { _id: new ObjectId(_id as string) },
		update: {
			$set: updateObj,
		},
		projection: get,
	});
};
