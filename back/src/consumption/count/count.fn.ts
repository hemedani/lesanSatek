import { type ActFn, type Document, ObjectId } from "lesan";
import { consumption } from "../../../mod.ts";
import { consumptionScopeMatch } from "../../../utils/consumptionScope.ts";
import { getAuth } from "../../../utils/grantAccess.ts";

export const countFn: ActFn = async (body) => {
  const {
    set: { unitId, wareModelId, reason, consumedFor },
  } = body.details;

  const { user, activeRole } = await getAuth();
  const roleMatch = await consumptionScopeMatch(activeRole, user);

  const requestedMatch: Document = {};

  unitId && (requestedMatch["unit._id"] = new ObjectId(unitId as string));
  wareModelId &&
    (requestedMatch["wareModel._id"] = new ObjectId(wareModelId as string));
  reason &&
    (requestedMatch.reason = { $regex: new RegExp(reason as string, "i") });
  consumedFor &&
    (requestedMatch.consumedFor = {
      $regex: new RegExp(consumedFor as string, "i"),
    });

  const hasRoleMatch = Object.keys(roleMatch).length > 0;
  const hasRequestedMatch = Object.keys(requestedMatch).length > 0;

  let match: Document = {};

  if (hasRoleMatch && hasRequestedMatch) {
    match = { $and: [roleMatch, requestedMatch] };
  } else if (hasRoleMatch) {
    match = roleMatch;
  } else if (hasRequestedMatch) {
    match = requestedMatch;
  }

  const qty = await consumption.countDocument({ filter: match });

  return { qty };
};
