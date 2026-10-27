import { type ActFn, ObjectId } from "lesan";
import { accountingPeriod } from "../../../mod.ts";
import { assertAccountingOrganizationAccess } from "../../../utils/accountingScope.ts";
import { throwError } from "../../../utils/throwError.ts";

export const addFn: ActFn = async (body) => {
  const { set, get } = body.details;
  const {
    activeRoleId: _activeRoleId,
    organizationId,
    fiscalYearId,
    ...rest
  } = set;

  await assertAccountingOrganizationAccess(organizationId);

  const organizationObjectId = new ObjectId(organizationId as string);
  const startDate = new Date(rest.startDate as Date);
  const endDate = new Date(rest.endDate as Date);

  if (startDate > endDate) {
    throwError("Period start date must precede end date");
  }

  const overlap = await accountingPeriod.findOne({
    filters: {
      "organization._id": organizationObjectId,
      startDate: { $lte: endDate },
      endDate: { $gte: startDate },
    },
    projection: { _id: 1, code: 1 },
  });

  if (overlap) throwError("Accounting periods cannot overlap");

  const relations: Record<string, unknown> = {
    organization: {
      _ids: organizationObjectId,
      relatedRelations: { accountingPeriods: true },
    },
  };

  if (fiscalYearId) {
    relations.fiscalYear = {
      _ids: new ObjectId(fiscalYearId as string),
      relatedRelations: { accountingPeriods: true },
    };
  }

  return await accountingPeriod.insertOne({
    doc: rest,
    relations,
    projection: get,
  });
};
