import { type ActFn, type Document, ObjectId } from "lesan";
import { stockMovement } from "../../../mod.ts";
import { getAuth } from "../../../utils/grantAccess.ts";
import { stockMovementReadMatch } from "../readScope.ts";

export const countFn: ActFn = async (body) => {
  const {
    set: { unitId, wareId, wareModelId, reason, referenceType, referenceId },
  } = body.details;

  const { user, activeRole } = await getAuth();

  const scopeMatch = await stockMovementReadMatch(activeRole, user);
  const match: Document = {};

  unitId && (match["unit._id"] = new ObjectId(unitId as string));
  wareId && (match["ware._id"] = new ObjectId(wareId));
  wareModelId && (match["wareModel._id"] = new ObjectId(wareModelId));
  reason && (match.reason = reason);
  referenceType && (match.referenceType = referenceType);
  referenceId && (match.referenceId = referenceId);

  const filter = scopeMatch ? { $and: [scopeMatch, match] } : match;

  const qty = await stockMovement.countDocument({ filter });

  return { qty };
};
