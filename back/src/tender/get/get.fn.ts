import { type ActFn, type Document, ObjectId } from "lesan";
import { tender } from "../../../mod.ts";
import { isScopeBypass } from "../../../utils/authzPolicy.ts";
import { getAuth } from "../../../utils/grantAccess.ts";
import { throwError } from "../../../utils/throwError.ts";
import { assertCanReadTender } from "../readScope.ts";

export const getFn: ActFn = async (body) => {
  const {
    set: { _id },
    get,
  } = body.details;

  const { user, activeRole } = await getAuth();

  const tenderId = new ObjectId(_id as string);
  const founded = await tender.findOne({
    filters: { _id: tenderId },
    projection: {
      purchasingRequest: {
        organization: { _id: 1 },
        requestingUnit: { _id: 1 },
        requester: { _id: 1 },
      },
      assignedVendors: { _id: 1 },
    },
  }) as Document | null;

  if (!founded) {
    if (!isScopeBypass(activeRole, user)) {
      throwError("You cant do this");
    }
  } else {
    assertCanReadTender(activeRole, user, founded);
  }

  return await tender
    .aggregation({
      pipeline: [{ $match: { _id: tenderId } }],
      projection: get,
    })
    .toArray();
};
