import { type ActFn, ObjectId } from "lesan";
import { account } from "../../../mod.ts";
import { assertAccountingOrganizationAccess } from "../../../utils/accountingScope.ts";
import { throwError } from "../../../utils/throwError.ts";

export const addFn: ActFn = async (body) => {
  const { set, get } = body.details;
  const {
    activeRoleId: _activeRoleId,
    organizationId,
    parentAccountId,
    ...rest
  } = set;

  await assertAccountingOrganizationAccess(organizationId);

  const organizationObjectId = new ObjectId(organizationId as string);
  const relations: Record<string, unknown> = {
    organization: {
      _ids: organizationObjectId,
      relatedRelations: { accounts: true },
    },
  };

  if (parentAccountId) {
    const parent = await account.findOne({
      filters: {
        _id: new ObjectId(parentAccountId as string),
        "organization._id": organizationObjectId,
      },
      projection: { _id: 1 },
    });

    if (!parent) throwError("Parent account not found in this organization");

    relations.parentAccount = {
      _ids: new ObjectId(parentAccountId as string),
      relatedRelations: { childAccounts: true },
    };
  }

  return await account.insertOne({
    doc: rest,
    relations,
    projection: get,
  });
};
