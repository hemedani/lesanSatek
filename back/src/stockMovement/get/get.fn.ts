import { type ActFn, type Document, ObjectId } from "lesan";
import { stockMovement } from "../../../mod.ts";
import { getAuth } from "../../../utils/grantAccess.ts";
import { throwError } from "../../../utils/throwError.ts";
import { stockMovementReadMatch } from "../readScope.ts";

export const getFn: ActFn = async (body) => {
  const {
    set: { _id },
    get,
  } = body.details;

  const { user, activeRole } = await getAuth();

  const movementId = new ObjectId(_id as string);
  const scopeMatch = await stockMovementReadMatch(activeRole, user);

  const pipeline: Document[] = [{ $match: { _id: movementId } }];

  if (scopeMatch) {
    pipeline.push({ $match: scopeMatch });
  }

  const founded = await stockMovement
    .aggregation({
      pipeline,
      projection: get,
    })
    .toArray();

  if (scopeMatch && founded.length === 0) {
    throwError("You cant do this");
  }

  return founded;
};
