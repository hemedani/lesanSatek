import { type ActFn, ObjectId } from "lesan";
import { budgetLine } from "../../../mod.ts";

export const addFn: ActFn = async (body) => {
  const { set, get } = body.details;

  const { activeRoleId, fiscalYearId, organizationId, unitId, wareTypeId, ...rest } = set;

  const relations: Record<string, unknown> = {};

  relations.fiscalYear = {
    _ids: new ObjectId(fiscalYearId as string),
    relatedRelations: {
      budgetLines: true,
    },
  };

  if (organizationId) {
    relations.organization = {
      _ids: new ObjectId(organizationId as string),
      relatedRelations: {
        budgetLines: true,
      },
    };
  }

  if (unitId) {
    relations.unit = {
      _ids: new ObjectId(unitId as string),
      relatedRelations: {
        budgetLines: true,
      },
    };
  }

  if (wareTypeId) {
    relations.wareType = {
      _ids: new ObjectId(wareTypeId as string),
      relatedRelations: {
        budgetLines: true,
      },
    };
  }

  return await budgetLine.insertOne({
    doc: rest,
    relations,
    projection: get,
  });
};
