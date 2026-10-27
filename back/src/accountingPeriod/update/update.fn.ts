import { type ActFn, type Document, ObjectId } from "lesan";
import { accountingPeriod } from "../../../mod.ts";
import { assertAccountingOrganizationAccess } from "../../../utils/accountingScope.ts";
import { throwError } from "../../../utils/throwError.ts";

export const updateFn: ActFn = async (body) => {
  const {
    set: { _id, activeRoleId: _activeRoleId, ...fields },
    get,
  } = body.details;

  const periodId = new ObjectId(_id as string);
  const founded = await accountingPeriod.findOne({
    filters: { _id: periodId },
    projection: {
      organization: { _id: 1 },
      status: 1,
      startDate: 1,
      endDate: 1,
    },
  }) as Document | null;

  if (!founded) throwError("Accounting period not found");

  await assertAccountingOrganizationAccess(
    (founded!.organization as Record<string, unknown> | undefined)?._id,
  );

  if (founded!.status !== "open") {
    throwError("Only open accounting periods can be edited");
  }

  const updateObj: Record<string, unknown> = { updatedAt: new Date() };
  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined) updateObj[key] = value;
  }

  const startDate = new Date(
    (updateObj.startDate as Date | undefined) ?? (founded!.startDate as Date),
  );
  const endDate = new Date(
    (updateObj.endDate as Date | undefined) ?? (founded!.endDate as Date),
  );

  if (startDate > endDate) {
    throwError("Period start date must precede end date");
  }

  const overlap = await accountingPeriod.findOne({
    filters: {
      _id: { $ne: periodId },
      "organization._id":
        (founded!.organization as Record<string, unknown>)._id,
      startDate: { $lte: endDate },
      endDate: { $gte: startDate },
    },
    projection: { _id: 1 },
  });

  if (overlap) throwError("Accounting periods cannot overlap");

  return await accountingPeriod.findOneAndUpdate({
    filter: { _id: periodId },
    update: { $set: updateObj },
    projection: get,
  });
};
