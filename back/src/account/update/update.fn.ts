import { type ActFn, type Document, ObjectId } from "lesan";
import { account } from "../../../mod.ts";
import { assertAccountingOrganizationAccess } from "../../../utils/accountingScope.ts";
import { throwError } from "../../../utils/throwError.ts";

export const updateFn: ActFn = async (body) => {
  const {
    set: { _id, activeRoleId: _activeRoleId, ...fields },
    get,
  } = body.details;

  const founded = await account.findOne({
    filters: { _id: new ObjectId(_id as string) },
    projection: { organization: { _id: 1 }, isSystem: 1 },
  }) as Document | null;

  if (!founded) throwError("Account not found");

  const organizationId =
    (founded!.organization as Record<string, unknown> | undefined)?._id;
  await assertAccountingOrganizationAccess(organizationId);

  const updateObj: Record<string, unknown> = { updatedAt: new Date() };
  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined) updateObj[key] = value;
  }

  if (
    updateObj.accountType !== undefined ||
    updateObj.code !== undefined ||
    updateObj.normalBalance !== undefined
  ) {
    const isSystem = founded!.isSystem === true;
    if (isSystem) {
      throwError("System accounts can only be renamed or deactivated");
    }
  }

  return await account.findOneAndUpdate({
    filter: { _id: new ObjectId(_id as string) },
    update: { $set: updateObj },
    projection: get,
  });
};
