import { type ActFn, ObjectId } from "lesan";
import { unit } from "../../../mod.ts";

export const addFn: ActFn = async (body) => {
  const { set, get } = body.details;

  const {
    activeRoleId,
    organizationId,
    parentUnitId,
    creatorId,
    headId,
    features,
    allowWareTypeIds,
    allowWareClassIds,
    allowWareGroupIds,
    allowWareModelIds,
    ...rest
  } = set;

  const relations: Record<string, unknown> = {};

  if (organizationId) {
    relations.organization = {
      _ids: new ObjectId(organizationId as string),
      relatedRelations: {
        units: true,
      },
    };
  }

  if (parentUnitId) {
    relations.parentUnit = {
      _ids: new ObjectId(parentUnitId as string),
      relatedRelations: {
        subUnits: true,
      },
    };
  }

  if (creatorId) {
    relations.creator = {
      _ids: new ObjectId(creatorId as string),
      relatedRelations: {
        createdUnits: true,
      },
    };
  }

  if (headId) {
    relations.head = {
      _ids: new ObjectId(headId as string),
    };
  }

	const createdUnit = await unit.insertOne({
    doc: {
      ...rest,
      ...(features !== undefined && { features }),
      ...(allowWareTypeIds !== undefined && { allowWareTypeIds }),
      ...(allowWareClassIds !== undefined && { allowWareClassIds }),
      ...(allowWareGroupIds !== undefined && { allowWareGroupIds }),
      ...(allowWareModelIds !== undefined && { allowWareModelIds }),
    },
    relations: relations as never,
    projection: { _id: 1 },
  });

  if (!createdUnit) return;

  return await unit.findOne({
    filters: { _id: createdUnit._id },
    projection: get,
  });
};
