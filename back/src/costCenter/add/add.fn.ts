import { type ActFn, type Document, ObjectId } from "lesan";
import { costCenter, unit } from "../../../mod.ts";
import { assertAccountingOrganizationAccess } from "../../../utils/accountingScope.ts";
import { throwError } from "../../../utils/throwError.ts";

export const addFn: ActFn = async (body) => {
  const { set, get } = body.details;
  const {
    activeRoleId: _activeRoleId,
    organizationId,
    unitId,
    responsibleUserId,
    ...rest
  } = set;

  await assertAccountingOrganizationAccess(organizationId);

  const organizationObjectId = new ObjectId(organizationId as string);
  const relations: Record<string, unknown> = {
    organization: {
      _ids: organizationObjectId,
      relatedRelations: { costCenters: true },
    },
  };

  if (unitId) {
    const unitDoc = await unit.findOne({
      filters: { _id: new ObjectId(unitId as string) },
      projection: { _id: 1, organization: { _id: 1 } },
    }) as Document | null;

    if (!unitDoc) throwError("Unit not found");

    const unitOrganizationId =
      (unitDoc!.organization as Record<string, unknown> | undefined)?._id
        ?.toString();

    if (unitOrganizationId !== String(organizationId)) {
      throwError("Unit does not belong to this organization");
    }

    relations.unit = {
      _ids: new ObjectId(unitId as string),
      relatedRelations: { costCenters: true },
    };
  }

  if (responsibleUserId) {
    relations.responsibleUser = {
      _ids: new ObjectId(responsibleUserId as string),
      relatedRelations: { responsibleCostCenters: true },
    };
  }

  return await costCenter.insertOne({
    doc: rest,
    relations,
    projection: get,
  });
};
