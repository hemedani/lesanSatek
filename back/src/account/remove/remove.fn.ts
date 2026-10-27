import { type ActFn, type Document, ObjectId } from "lesan";
import { account, journalEntryLine } from "../../../mod.ts";
import { assertAccountingOrganizationAccess } from "../../../utils/accountingScope.ts";
import { throwError } from "../../../utils/throwError.ts";

export const removeFn: ActFn = async (body) => {
  const {
    set: { _id, hardCascade },
  } = body.details;

  const accountId = new ObjectId(_id as string);
  const founded = await account.findOne({
    filters: { _id: accountId },
    projection: { organization: { _id: 1 }, isSystem: 1 },
  }) as Document | null;

  if (!founded) throwError("Account not found");

  const organizationId =
    (founded!.organization as Record<string, unknown> | undefined)?._id;
  await assertAccountingOrganizationAccess(organizationId);

  if (founded!.isSystem === true) {
    throwError("System accounts cannot be deleted");
  }

  const childCount = await account.countDocument({
    filter: { "parentAccount._id": accountId },
  });

  if (childCount > 0) {
    throwError("Delete child accounts first");
  }

  const lineCount = await journalEntryLine.countDocument({
    filter: { "account._id": accountId },
  });

  if (lineCount > 0) {
    throwError("Account has journal entries and cannot be deleted");
  }

  return await account.deleteOne({
    filter: { _id: accountId },
    hardCascade: hardCascade || false,
  });
};
