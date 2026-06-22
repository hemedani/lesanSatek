import type { ActFn, Document } from "lesan";
import { budgetLine } from "../../../mod.ts";

export const countFn: ActFn = async (body) => {
  const {
    set: { fiscalYearId, organizationId, unitId },
    get,
  } = body.details;

  const filters: Document = {};

  fiscalYearId && (filters["fiscalYear"] = fiscalYearId);
  organizationId && (filters["organization"] = organizationId);
  unitId && (filters["unit"] = unitId);

  const foundedItemsLength = await budgetLine.countDocument({
    filter: filters,
  });

  return { qty: foundedItemsLength };
};
