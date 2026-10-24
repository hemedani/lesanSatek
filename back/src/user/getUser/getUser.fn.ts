import { type ActFn, type Document, ObjectId } from "lesan";
import { user } from "../../../mod.ts";
import { throwError } from "@lib";
import { isScopeBypass } from "../../../utils/authzPolicy.ts";
import { getAuth } from "../../../utils/grantAccess.ts";
import { isSelfOnlyRole, userReadFilter } from "../../../utils/readScope.ts";

export const getUserFn: ActFn = async (body) => {
  const {
    set: { _id },
    get,
  } = body.details;

  const { user: rawUser, activeRole } = await getAuth();
  const authUser = rawUser as unknown as { _id?: unknown; isGhost?: boolean };
  const requestedId = String(_id);
  const isUnrestricted = isScopeBypass(activeRole, authUser);

  if (
    !isUnrestricted &&
    isSelfOnlyRole(activeRole) &&
    String(authUser._id) !== requestedId
  ) {
    throwError("You cant do this");
  }

  const pipeline: Document[] = [
    { $match: { _id: new ObjectId(requestedId) } },
  ];

  const scopeFilter = userReadFilter(activeRole, authUser);

  scopeFilter && pipeline.push({ $match: scopeFilter });

  const foundedUser = await user
    .aggregation({
      pipeline,
      projection: get,
    })
    .toArray();
  if (foundedUser.length < 1) {
    throwError(isUnrestricted ? "user not exist" : "You cant do this");
  }

  return foundedUser[0];
};
