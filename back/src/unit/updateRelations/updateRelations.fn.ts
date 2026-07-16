import { type ActFn, ObjectId } from "lesan";
import { unit, user } from "../../../mod.ts";

export const updateRelationsFn: ActFn = async (body) => {
  const {
    set: { _id, organizationId, parentUnitId, creatorId, headId },
    get,
  } = body.details;

  const unitId = new ObjectId(_id);

  if (organizationId !== undefined) {
    await unit.addRelation({
      filters: { _id: unitId },
      relations: {
        organization: {
          _ids: new ObjectId(organizationId as string),
          relatedRelations: {
            units: true,
          },
        },
      },
      projection: get,
      replace: true,
    });
  }

  if (parentUnitId !== undefined) {
    await unit.addRelation({
      filters: { _id: unitId },
      relations: {
        parentUnit: {
          _ids: new ObjectId(parentUnitId as string),
          relatedRelations: {
            subUnits: true,
          },
        },
      },
      projection: get,
      replace: true,
    });
  }

  if (creatorId !== undefined) {
    await unit.addRelation({
      filters: { _id: unitId },
      relations: {
        creator: {
          _ids: new ObjectId(creatorId as string),
          relatedRelations: {
            createdUnits: true,
          },
        },
      },
      projection: get,
      replace: true,
    });
  }

  if (headId !== undefined) {
    const currentUnit = await unit.findOne({
      filters: { _id: unitId },
      projection: { head: { _id: 1 } },
    }) as Record<string, unknown> | undefined;

    const oldHeadId = currentUnit?.head
      ? (currentUnit.head as Record<string, unknown>)._id?.toString()
      : undefined;

    await unit.addRelation({
      filters: { _id: unitId },
      relations: {
        head: {
          _ids: new ObjectId(headId as string),
          relatedRelations: {
            headedUnit: true,
          },
        },
      },
      projection: get,
      replace: true,
    });

    const unitIdStr = unitId.toString();

    await user.findOneAndUpdate({
      filter: {
        _id: new ObjectId(headId as string),
        roles: { $not: { $elemMatch: { name: "UnitHead", scopeType: "unit", scopeId: unitIdStr } } },
      },
      update: { $push: { roles: { roleId: crypto.randomUUID(), name: "UnitHead", scopeType: "unit", scopeId: unitIdStr } } },
      projection: { _id: 1 },
    });

    if (oldHeadId && oldHeadId !== headId) {
      await user.findOneAndUpdate({
        filter: { _id: new ObjectId(oldHeadId) },
        update: { $pull: { roles: { name: "UnitHead", scopeType: "unit", scopeId: unitIdStr } } },
        projection: { _id: 1 },
      });
    }
  }

  return await unit.findOne({
    filters: { _id: unitId },
    projection: get,
  });
};
