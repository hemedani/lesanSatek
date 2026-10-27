import { type ActFn } from "lesan";
import { assertAccountingOrganizationAccess } from "../../../utils/accountingScope.ts";
import { ensureDefaultChartOfAccounts } from "../../../utils/accountingEngine.ts";

export const seedDefaultChartOfAccountsFn: ActFn = async (body) => {
  const {
    set: { organizationId },
  } = body.details;

  await assertAccountingOrganizationAccess(organizationId);
  await ensureDefaultChartOfAccounts(String(organizationId));

  return { success: 1 };
};
