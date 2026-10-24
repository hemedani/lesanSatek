import type { ActFn, Document } from "lesan";
import { ObjectId } from "lesan";
import { stepApproval } from "../../../mod.ts";
import { getAuth } from "../../../utils/grantAccess.ts";
import { stepApprovalAllowedUnitIds } from "../readScope.ts";

export const countFn: ActFn = async (body) => {
  const {
    set: { unitId, status, stepId, fromDate, toDate },
  } = body.details;

  const { user, activeRole } = await getAuth();
  const allowedUnitIds = await stepApprovalAllowedUnitIds(activeRole, user);

  const filters: Document = {};

  if (allowedUnitIds !== null) {
    filters.$and = [{ "unit._id": { $in: allowedUnitIds } }];
  }

  unitId && (filters["unit._id"] = new ObjectId(unitId as string));
  status && (filters.status = status);
  stepId && (filters["processStep._id"] = new ObjectId(stepId as string));

  if (fromDate || toDate) {
    const createdAtFilter: Document = {};
    fromDate && (createdAtFilter["$gte"] = new Date(fromDate as string));
    toDate && (createdAtFilter["$lte"] = new Date(toDate as string));
    filters["createdAt"] = createdAtFilter;
  }

  const foundedItemsLength = await stepApproval.countDocument({
    filter: filters,
  });

  return { qty: foundedItemsLength };
};
