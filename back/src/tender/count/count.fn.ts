import type { ActFn, Document } from "lesan";
import { tender } from "../../../mod.ts";
import { getAuth } from "../../../utils/grantAccess.ts";
import { tenderReadMatch } from "../readScope.ts";

/**
 * Counts tenders with the same read scope as `tender.gets`.
 *
 * The store-head tender page renders its KPI cards from this act, so the count
 * must be scoped exactly like the list it summarises — otherwise the header can
 * disagree with the rows underneath it.
 */
export const countFn: ActFn = async (body) => {
  const {
    set: { title, status, purchasingRequestId },
    get,
  } = body.details;

  const { user, activeRole } = await getAuth();

  const filters: Document = {};

  title && (filters["title"] = { $regex: title, $options: "i" });
  status && (filters["status"] = status);
  purchasingRequestId && (filters["purchasingRequest"] = purchasingRequestId);

  const readMatch = tenderReadMatch(activeRole, user);
  const filter =
    readMatch && Object.keys(readMatch).length > 0
      ? { $and: [filters, readMatch] }
      : filters;

  const foundedItemsLength = await tender.countDocument({ filter });

  return { qty: foundedItemsLength };
};
