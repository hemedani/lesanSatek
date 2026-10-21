import { type ActFn, type Document, ObjectId } from "lesan";
import { stepApproval } from "../../../mod.ts";
import { getAuth } from "../../../utils/grantAccess.ts";
import { assertCanReadStepApproval } from "../readScope.ts";

export const getFn: ActFn = async (body) => {
  const {
    set: { _id },
    get,
  } = body.details;

  const { user, activeRole } = await getAuth();
  const approvalId = new ObjectId(_id as string);

  const founded = await stepApproval.findOne({
    filters: { _id: approvalId },
    projection: { unit: { _id: 1 } },
  }) as Document | null;

  if (founded) {
    await assertCanReadStepApproval(activeRole, user, founded);
  }

  return await stepApproval
    .aggregation({
      pipeline: [{ $match: { _id: approvalId } }],
      projection: get,
    })
    .toArray();
};
