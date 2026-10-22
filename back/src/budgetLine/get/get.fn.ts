import { type ActFn, type Document, ObjectId } from "lesan";
import { budgetLine } from "../../../mod.ts";
import { isScopeBypass } from "../../../utils/authzPolicy.ts";
import {
  activeFinanceOrganizationId,
  assertCanReadBudgetLine,
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

  const budgetLineId = new ObjectId(_id as string);
  const founded = await budgetLine.findOne({
    filters: { _id: budgetLineId },
    projection: { organization: { _id: 1 }, unit: { _id: 1 } },
  }) as Document | null;

  if (!founded) {
    if (!isScopeBypass(activeRole, user)) {
      throwError("You cant do this");
    }
  } else {
    assertCanReadBudgetLine(activeRole, user, founded, financeOrganizationId);
  }

  return await budgetLine
    .aggregation({
      pipeline: [{ $match: { _id: budgetLineId } }],
      projection: get,
    })
    .toArray();
};
