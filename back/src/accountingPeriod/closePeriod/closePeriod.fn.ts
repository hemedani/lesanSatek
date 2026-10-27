import { type ActFn, type Document, ObjectId } from "lesan";
import { accountingPeriod, journalEntry } from "../../../mod.ts";
import { assertAccountingOrganizationAccess } from "../../../utils/accountingScope.ts";
import { getAuth } from "../../../utils/grantAccess.ts";
import { throwError } from "../../../utils/throwError.ts";

export const closePeriodFn: ActFn = async (body) => {
  const {
    set: { _id },
    get,
  } = body.details;

  const periodId = new ObjectId(_id as string);
  const period = await accountingPeriod.findOne({
    filters: { _id: periodId },
    projection: { organization: { _id: 1 }, status: 1, code: 1 },
  }) as Document | null;

  if (!period) throwError("Accounting period not found");

  await assertAccountingOrganizationAccess(
    (period!.organization as Record<string, unknown> | undefined)?._id,
  );

  if (period!.status !== "open") {
    throwError(
      `Accounting period ${period!.code} is already ${period!.status}`,
    );
  }

  const draftEntries = await journalEntry.countDocument({
    filter: { "period._id": periodId, status: "draft" },
  });

  if (draftEntries > 0) {
    throwError("Resolve draft journal entries before closing the period");
  }

  const now = new Date();

  await accountingPeriod.findOneAndUpdate({
    filter: { _id: periodId },
    update: {
      $set: { status: "closed", closedAt: now, updatedAt: now },
    },
    projection: { _id: 1 },
  });

  const { user } = await getAuth();

  if (user?._id) {
    await accountingPeriod.addRelation({
      filters: { _id: periodId },
      relations: {
        closedBy: {
          _ids: new ObjectId(String(user._id)),
          relatedRelations: { closedAccountingPeriods: true },
        },
      },
      projection: { _id: 1 },
    });
  }

  return await accountingPeriod
    .aggregation({ pipeline: [{ $match: { _id: periodId } }], projection: get })
    .toArray();
};
