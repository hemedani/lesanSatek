import { type ActFn, type Document, ObjectId } from "lesan";
import { account } from "../../../mod.ts";
import {
  accountingReadMatch,
  activeAccountingOrganizationId,
} from "../../../utils/accountingScope.ts";
import { getAuth } from "../../../utils/grantAccess.ts";

export const countFn: ActFn = async (body) => {
  const {
    set: {
      code,
      name,
      accountType,
      systemKey,
      isActive,
      parentAccountId,
      organizationId,
    },
  } = body.details;

  const { user, activeRole } = await getAuth();
  const financeOrganizationId = await activeAccountingOrganizationId(
    activeRole,
    user,
  );
  const readMatch = accountingReadMatch(
    activeRole,
    user,
    financeOrganizationId,
  );

  const filter: Document = { ...(readMatch ?? {}) };
  organizationId && (filter["organization._id"] = new ObjectId(organizationId));
  code && (filter.code = { $regex: code, $options: "i" });
  name && (filter.name = { $regex: name, $options: "i" });
  accountType && (filter.accountType = accountType);
  systemKey && (filter.systemKey = systemKey);
  isActive !== undefined && (filter.isActive = isActive);
  parentAccountId && (filter["parentAccount._id"] = parentAccountId);

  return await account.countDocument({ filter });
};
