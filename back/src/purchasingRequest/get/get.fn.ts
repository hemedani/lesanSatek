import { type ActFn, type Document, ObjectId } from "lesan";
import { purchasingRequest } from "../../../mod.ts";
import { getAuth } from "../../../utils/grantAccess.ts";
import { isScopeBypass } from "../../../utils/authzPolicy.ts";
import { throwError } from "../../../utils/throwError.ts";
import { assertCanReadPurchasingRequest } from "../readScope.ts";

export const getFn: ActFn = async (body) => {
  const {
    set: { _id },
    get,
  } = body.details;

  const { user, activeRole } = await getAuth();
  const requestId = new ObjectId(_id as string);

  const founded = await purchasingRequest.findOne({
    filters: { _id: requestId },
    projection: {
      organization: { _id: 1 },
      requestingUnit: { _id: 1 },
      requester: { _id: 1 },
      store: { _id: 1 },
    },
  }) as Document | null;

  if (!founded) {
    if (!isScopeBypass(activeRole, user)) {
      throwError("You cant do this");
    }
  } else {
    assertCanReadPurchasingRequest(activeRole, user, founded);
  }

  return await purchasingRequest
    .aggregation({
      pipeline: [{ $match: { _id: requestId } }],
      projection: get,
    })
    .toArray();
};
