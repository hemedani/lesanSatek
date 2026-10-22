import { type ActFn, type Document, ObjectId } from "lesan";
import { stockMovement } from "../../../mod.ts";
import { isManagerLike } from "../../../utils/authzPolicy.ts";
import { getAuth } from "../../../utils/grantAccess.ts";
import { throwError } from "../../../utils/throwError.ts";
import { assertUnitInActorScope } from "../../../utils/unitScope.ts";

export const getFn: ActFn = async (body) => {
  const {
    set: { _id },
    get,
  } = body.details;

  const { user, activeRole } = await getAuth();

  const movementId = new ObjectId(_id as string);
  const founded = await stockMovement.findOne({
    filters: { _id: movementId },
    projection: { unit: { _id: 1 } },
  }) as Document | null;

  if (!founded) {
    if (!(user.isGhost || isManagerLike(activeRole))) {
      throwError("You cant do this");
    }
  } else {
    await assertUnitInActorScope(
      user,
      activeRole,
      (founded.unit as Record<string, unknown> | undefined)?._id,
    );
  }

  return await stockMovement
    .aggregation({
      pipeline: [{ $match: { _id: movementId } }],
      projection: get,
    })
    .toArray();
};
