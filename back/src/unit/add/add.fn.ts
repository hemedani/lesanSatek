import { type ActFn, ObjectId } from "lesan";
import { unit, user, coreApp } from "../../../mod.ts";
import type { MyContext } from "@lib";

const addUnitHeadRole = async (headUserId: string, unitId: string) => {
  await user.findOneAndUpdate({
    filter: {
      _id: new ObjectId(headUserId),
      roles: { $not: { $elemMatch: { name: "UnitHead", scopeType: "unit", scopeId: unitId } } },
    },
    update: { $push: { roles: { roleId: crypto.randomUUID(), name: "UnitHead", scopeType: "unit", scopeId: unitId } } },
    projection: { _id: 1 },
  });
};

const removeUnitHeadRole = async (headUserId: string, unitId: string) => {
  await user.findOneAndUpdate({
    filter: { _id: new ObjectId(headUserId) },
    update: { $pull: { roles: { name: "UnitHead", scopeType: "unit", scopeId: unitId } } },
    projection: { _id: 1 },
  });
};

export const addFn: ActFn = async (body) => {
  const { set, get } = body.details;
  const { user }: MyContext = coreApp.contextFns
    .getContextModel() as MyContext;

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
      relatedRelations: {
        headedUnit: true,
      },
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
    relations,
    projection: { _id: 1 },
  });

  if (!createdUnit) return;

  if (headId) {
    await addUnitHeadRole(headId as string, createdUnit._id.toString());
  }

  return await unit.findOne({
    filters: { _id: createdUnit._id },
    projection: get,
  });
};

export { addUnitHeadRole, removeUnitHeadRole };
