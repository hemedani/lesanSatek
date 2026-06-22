import { type ActFn, ObjectId } from "lesan";
import { unit } from "../../../mod.ts";

export const updateFn: ActFn = async (body) => {
  const {
    set: {
      _id, name, enName, description, isActive, type,
      address, phone, email,
      warehouseCapacity, hasColdStorage,
      fleetSize, serviceRadius,
      features,
      allowWareTypeIds,
      allowWareClassIds,
      allowWareGroupIds,
      allowWareModelIds,
    },
    get,
  } = body.details;

  const updateObj: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  name !== undefined && (updateObj.name = name);
  enName !== undefined && (updateObj.enName = enName);
  description !== undefined && (updateObj.description = description);
  isActive !== undefined && (updateObj.isActive = isActive);
  type !== undefined && (updateObj.type = type);
  address !== undefined && (updateObj.address = address);
  phone !== undefined && (updateObj.phone = phone);
  email !== undefined && (updateObj.email = email);
  warehouseCapacity !== undefined && (updateObj.warehouseCapacity = warehouseCapacity);
  hasColdStorage !== undefined && (updateObj.hasColdStorage = hasColdStorage);
  fleetSize !== undefined && (updateObj.fleetSize = fleetSize);
  serviceRadius !== undefined && (updateObj.serviceRadius = serviceRadius);
  features !== undefined && (updateObj.features = features);
  allowWareTypeIds !== undefined && (updateObj.allowWareTypeIds = allowWareTypeIds);
  allowWareClassIds !== undefined && (updateObj.allowWareClassIds = allowWareClassIds);
  allowWareGroupIds !== undefined && (updateObj.allowWareGroupIds = allowWareGroupIds);
  allowWareModelIds !== undefined && (updateObj.allowWareModelIds = allowWareModelIds);

  return await unit.findOneAndUpdate({
    filter: { _id: new ObjectId(_id as string) },
    update: {
      $set: updateObj,
    },
    projection: get,
  });
};
