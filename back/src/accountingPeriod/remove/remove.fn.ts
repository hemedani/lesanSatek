import { type ActFn, type Document, ObjectId } from "lesan";
import { accountingPeriod, journalEntry } from "../../../mod.ts";
import { assertAccountingOrganizationAccess } from "../../../utils/accountingScope.ts";
import { throwError } from "../../../utils/throwError.ts";

export const removeFn: ActFn = async (body) => {
  const {
    set: { _id, hardCascade },
  } = body.details;

  const periodId = new ObjectId(_id as string);
  const founded = await accountingPeriod.findOne({
    filters: { _id: periodId },
    projection: { organization: { _id: 1 }, status: 1 },
  }) as Document | null;

  if (!founded) throwError("Accounting period not found");

  await assertAccountingOrganizationAccess(
    (founded!.organization as Record<string, unknown> | undefined)?._id,
  );

  if (founded!.status !== "open") {
    throwError("Closed or locked periods cannot be deleted");
  }

  const entryCount = await journalEntry.countDocument({
    filter: { "period._id": periodId },
  });

  if (entryCount > 0) {
    throwError("Period has journal entries and cannot be deleted");
  }

  return await accountingPeriod.deleteOne({
    filter: { _id: periodId },
    hardCascade: hardCascade || false,
  });
};
