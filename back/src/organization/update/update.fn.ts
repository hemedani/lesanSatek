import { type ActFn, type Infer, object, ObjectId } from "lesan";
import { organization } from "../../../mod.ts";
import { organization_pure } from "@model";

export const updateFn: ActFn = async (body) => {
	const {
		set: { _id, name, enName, description, isActive },
		get,
	} = body.details;

	const pureStruct = object(organization_pure);
	const updateObj: Partial<Infer<typeof pureStruct>> = {
		updatedAt: new Date(),
	};

	name && (updateObj.name = name);
	enName && (updateObj.enName = enName);
	description && (updateObj.description = description);
	isActive !== undefined && (updateObj.isActive = isActive);

	return await organization.findOneAndUpdate({
		filter: { _id: new ObjectId(_id as string) },
		update: {
			$set: updateObj,
		},
		projection: get,
	});
};
