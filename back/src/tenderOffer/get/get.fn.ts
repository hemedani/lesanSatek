import { type ActFn, type Document, ObjectId } from "lesan";
import { tenderOffer } from "../../../mod.ts";
import { isScopeBypass } from "../../../utils/authzPolicy.ts";
import { getAuth } from "../../../utils/grantAccess.ts";
import { throwError } from "../../../utils/throwError.ts";
import { assertCanReadTenderOffer } from "../readScope.ts";

export const getFn: ActFn = async (body) => {
  const {
    set: { _id },
    get,
  } = body.details;

  const { user, activeRole } = await getAuth();

  const offerId = new ObjectId(_id as string);
  const founded = await tenderOffer.findOne({
    filters: { _id: offerId },
    projection: {
      store: { _id: 1 },
      tender: {
        purchasingRequest: {
          organization: { _id: 1 },
          requestingUnit: { _id: 1 },
          requester: { _id: 1 },
        },
      },
    },
  }) as Document | null;

  if (!founded) {
    if (!isScopeBypass(activeRole, user)) {
      throwError("You cant do this");
    }
  } else {
    assertCanReadTenderOffer(activeRole, user, founded);
  }

  return await tenderOffer
    .aggregation({
      pipeline: [{ $match: { _id: offerId } }],
      projection: get,
    })
    .toArray();
};
