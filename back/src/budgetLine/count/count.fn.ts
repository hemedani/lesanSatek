import type { ActFn, Document } from "lesan";
import { budgetLine } from "../../../mod.ts";
import {
  activeFinanceOrganizationId,
  budgetLineReadMatch,
} from "../../../utils/financeScope.ts";
import { getAuth } from "../../../utils/grantAccess.ts";

export const countFn: ActFn = async (body) => {
  const {
    set: { fiscalYearId, organizationId, unitId },
  } = body.details;

  const { user, activeRole } = await getAuth();
  const financeOrganizationId = await activeFinanceOrganizationId(
    activeRole,
    user,
  );
  const readMatch = budgetLineReadMatch(
    activeRole,
    user,
    financeOrganizationId,
  );

  const filters: Document = {};

  if (readMatch) {
    filters.$and = [readMatch];
  }

  fiscalYearId && (filters["fiscalYear"] = fiscalYearId);
  organizationId && (filters["organization"] = organizationId);
  unitId && (filters["unit"] = unitId);

  const foundedItemsLength = await budgetLine.countDocument({
    filter: filters,
  });

  return { qty: foundedItemsLength };
};
