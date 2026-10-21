import { type ActFn, type Document, ObjectId } from "lesan";
import { inventory } from "../../../mod.ts";
import { isManagerLike } from "../../../utils/authzPolicy.ts";
import { getAuth } from "../../../utils/grantAccess.ts";
import { assertCanReadUnit } from "../../../utils/readScope.ts";
import { throwError } from "../../../utils/throwError.ts";

export const getFn: ActFn = async (body) => {
  const {
    set: { _id },
    get,
  } = body.details;

  const { user, activeRole } = await getAuth();
  const inventoryId = new ObjectId(_id as string);

  const record = await inventory.findOne({
    filters: { _id: inventoryId },
    projection: { unit: { _id: 1, organization: { _id: 1 } } },
  }) as Document;

  if (!(user.isGhost || isManagerLike(activeRole))) {
    if (!record) throwError("You cant do this");

    const unitRelation = record.unit as
      | {
        _id?: unknown;
        organization?: { _id?: unknown } | null;
      }
      | null
      | undefined;

    const unitId = unitRelation?._id === null ||
        unitRelation?._id === undefined
      ? ""
      : String(unitRelation._id);

    if (!unitId) throwError("You cant do this");

    await assertCanReadUnit(activeRole, user, unitId);
  }

  return await inventory
    .aggregation({
      pipeline: [{ $match: { _id: inventoryId } }],
      projection: get,
    })
    .toArray();
};
