import { type ActFn, type Document, ObjectId } from "lesan";
import { budgetAllocation } from "../../../mod.ts";
import { isScopeBypass } from "../../../utils/authzPolicy.ts";
import {
  activeFinanceOrganizationId,
  assertCanReadBudgetAllocation,
} from "../../../utils/financeScope.ts";
import { getAuth } from "../../../utils/grantAccess.ts";
import { throwError } from "../../../utils/throwError.ts";

export const getFn: ActFn = async (body) => {
  const {
    set: { _id },
    get,
  } = body.details;

  const { user, activeRole } = await getAuth();
  const financeOrganizationId = await activeFinanceOrganizationId(
    activeRole,
    user,
  );

  const allocationId = new ObjectId(_id as string);
  const founded = await budgetAllocation.findOne({
    filters: { _id: allocationId },
    projection: { budgetLine: { organization: { _id: 1 } } },
  }) as Document | null;

  if (!founded) {
    if (!isScopeBypass(activeRole, user)) {
      throwError("You cant do this");
    }
  } else {
    assertCanReadBudgetAllocation(
      activeRole,
      user,
      founded,
      financeOrganizationId,
    );
  }

  return await budgetAllocation
    .aggregation({
      pipeline: [{ $match: { _id: allocationId } }],
      projection: get,
    })
    .toArray();
};
