import { type ActFn, ObjectId } from "lesan";
import { unit } from "../../../mod.ts";

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
  }

  return await unit.findOne({
    filters: { _id: unitId },
    projection: get,
  });
};
