import { type ActFn, type Document, ObjectId } from "lesan";
import { accountingPeriod } from "../../../mod.ts";
import { isScopeBypass } from "../../../utils/authzPolicy.ts";
import {
  accountingDocumentOrganizationId,
  activeAccountingOrganizationId,
  assertCanReadAccountingDocument,
} from "../../../utils/accountingScope.ts";
import { getAuth } from "../../../utils/grantAccess.ts";
import { throwError } from "../../../utils/throwError.ts";

export const getFn: ActFn = async (body) => {
  const {
    set: { _id },
    get,
  } = body.details;

  const { user, activeRole } = await getAuth();
  const financeOrganizationId = await activeAccountingOrganizationId(
    activeRole,
    user,
  );

  const periodId = new ObjectId(_id as string);
  const founded = await accountingPeriod.findOne({
    filters: { _id: periodId },
    projection: { organization: { _id: 1 } },
  }) as Document | null;

  if (!founded) {
    if (!isScopeBypass(activeRole, user)) throwError("You cant do this");
  } else {
    assertCanReadAccountingDocument(
      activeRole,
      user,
      accountingDocumentOrganizationId(founded),
      financeOrganizationId,
    );
  }

  return await accountingPeriod
    .aggregation({
      pipeline: [{ $match: { _id: periodId } }],
      projection: get,
    })
    .toArray();
};
