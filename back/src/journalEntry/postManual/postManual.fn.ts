import { type ActFn, ObjectId } from "lesan";
import { journalEntry } from "../../../mod.ts";
import { postJournalEntry } from "../../../utils/accountingEngine.ts";
import type { JournalLineInput } from "../../../utils/accountingEngine.ts";
import { assertAccountingOrganizationAccess } from "../../../utils/accountingScope.ts";
import { getAuth } from "../../../utils/grantAccess.ts";

export const postManualFn: ActFn = async (body) => {
  const { set, get } = body.details;
  const {
    activeRoleId: _activeRoleId,
    organizationId,
    entryDate,
    description,
    reference,
    idempotencyKey,
    lines,
  } = set;

  await assertAccountingOrganizationAccess(organizationId);

  const { user } = await getAuth();

  const result = await postJournalEntry({
    organizationId: String(organizationId),
    entryDate: entryDate ? new Date(entryDate as Date) : new Date(),
    description: description as string | undefined,
    reference: reference as string | undefined,
    idempotencyKey: idempotencyKey as string | undefined,
    sourceType: "manual",
    sourceId: idempotencyKey as string | undefined,
    createdBy: user?._id ? String(user._id) : undefined,
    lines: (lines ?? []) as JournalLineInput[],
  });

  return await journalEntry
    .aggregation({
      pipeline: [{ $match: { _id: new ObjectId(result.entryId) } }],
      projection: get,
    })
    .toArray();
};
