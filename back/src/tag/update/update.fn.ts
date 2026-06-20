import { type ActFn, type Infer, object, ObjectId } from "lesan";
import { tag } from "../../../mod.ts";
import { tag_pure } from "@model";

export const updateFn: ActFn = async (body) => {
	const {
		set: { _id, name, description, color, icon },
		get,
	} = body.details;

	const pureStruct = object(tag_pure);
	const updateObj: Partial<Infer<typeof pureStruct>> = {
		updatedAt: new Date(),
	};

	name && (updateObj.name = name);
	description && (updateObj.description = description);
	color && (updateObj.color = color);
	icon && (updateObj.icon = icon);

	return await tag.findOneAndUpdate({
		filter: { _id: new ObjectId(_id as string) },
		update: {
			$set: updateObj,
		},
		projection: get,
	});
};
