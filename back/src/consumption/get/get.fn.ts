import { type ActFn, type Document, ObjectId } from "lesan";
import { consumption } from "../../../mod.ts";
import {
  consumptionScopeAllowsUnit,
  consumptionScopeMatch,
} from "../../../utils/consumptionScope.ts";
import { getAuth } from "../../../utils/grantAccess.ts";
import { throwError } from "../../../utils/throwError.ts";

export const getFn: ActFn = async (body) => {
  const {
    set: { _id },
    get,
  } = body.details;

  const { user, activeRole } = await getAuth();
  const consumptionId = new ObjectId(_id as string);

  const founded = await consumption.findOne({
    filters: { _id: consumptionId },
    projection: { unit: { _id: 1 } },
  }) as Document | null;

  if (founded) {
    const scope = await consumptionScopeMatch(activeRole, user);
    const unitRelation = founded.unit as { _id?: unknown } | null | undefined;

    if (!consumptionScopeAllowsUnit(scope, unitRelation?._id)) {
      throwError("You cant do this");
    }
  }

  return await consumption
    .aggregation({
      pipeline: [{ $match: { _id: consumptionId } }],
      projection: get,
    })
    .toArray();
};
