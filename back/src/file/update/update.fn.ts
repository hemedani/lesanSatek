import { type ActFn, ObjectId } from "lesan";
import { file } from "../../../mod.ts";

export const updateFn: ActFn = async (body) => {
  const {
    set: { _id, name, mimeType, size, type, alt_text },
    get,
  } = body.details;

  const updateObj: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  name && (updateObj.name = name);
  mimeType && (updateObj.mimeType = mimeType);
  size !== undefined && (updateObj.size = size);
  type && (updateObj.type = type);
  alt_text && (updateObj.alt_text = alt_text);

  return await file.findOneAndUpdate({
    filter: { _id: new ObjectId(_id as string) },
    update: { $set: updateObj },
    projection: get,
  });
};
