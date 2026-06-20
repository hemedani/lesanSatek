import { type ActFn, ObjectId } from "lesan";
import { unit, coreApp } from "../../../mod.ts";
import type { MyContext } from "@lib";

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

  return await unit.insertOne({
    doc: rest,
    relations,
    projection: get,
  });
};
