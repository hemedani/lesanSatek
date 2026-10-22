import { type ActFn, type Document, ObjectId } from "lesan";
import { fiscalYear } from "../../../mod.ts";
import { isManagerLike } from "../../../utils/authzPolicy.ts";
import {
  activeFinanceOrganizationId,
  assertCanReadFiscalYear,
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

  const fiscalYearId = new ObjectId(_id as string);
  const founded = await fiscalYear.findOne({
    filters: { _id: fiscalYearId },
    projection: { organization: { _id: 1 } },
  }) as Document | null;

  if (!founded) {
    if (!(user.isGhost || isManagerLike(activeRole))) {
      throwError("You cant do this");
    }
  } else {
    assertCanReadFiscalYear(activeRole, user, founded, financeOrganizationId);
  }

  return await fiscalYear
    .aggregation({
      pipeline: [{ $match: { _id: fiscalYearId } }],
      projection: get,
    })
    .toArray();
};
