import { type ActFn, type Document, ObjectId } from "lesan";
import { budgetLine, fiscalYear } from "../../../mod.ts";
import { checkFinanceUnitAccess } from "../../../utils/checkFinanceUnitAccess.ts";
import { throwError } from "../../../utils/throwError.ts";

export const addFn: ActFn = async (body) => {
  const { set, get } = body.details;

  const { activeRoleId, fiscalYearId, organizationId, unitId, wareTypeId, ...rest } = set;

  const fiscalYearDoc = await fiscalYear.findOne({
    filters: { _id: new ObjectId(fiscalYearId as string) },
    projection: { organization: { _id: 1 } },
  }) as Document;

  const fiscalYearOrganizationId =
    (fiscalYearDoc?.organization as Record<string, unknown> | undefined)?._id;

  if (
    organizationId &&
    fiscalYearOrganizationId &&
    String(organizationId) !== String(fiscalYearOrganizationId)
  ) {
    throwError("You cant do this");
  }

  await checkFinanceUnitAccess({
    organizationId: String(organizationId ?? fiscalYearOrganizationId ?? "") || undefined,
    unitId: unitId ? String(unitId) : undefined,
  });

  const totalAlloc = (rest.totalAllocated as number) || 0;
  const totalEnc = (rest.totalEncumbered as number) || 0;
  const totalSpent = (rest.totalSpent as number) || 0;
  rest.remainingBudget = totalAlloc - totalEnc - totalSpent;

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
