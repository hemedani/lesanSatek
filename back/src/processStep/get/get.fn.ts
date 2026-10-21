import { type ActFn, type Document, ObjectId } from "lesan";
import { processStep } from "../../../mod.ts";
import { getAuth } from "../../../utils/grantAccess.ts";
import { throwError } from "../../../utils/throwError.ts";
import { assertCanReadProcessStep } from "../readScope.ts";

export const getFn: ActFn = async (body) => {
  const {
    set: { _id },
    get,
  } = body.details;

  const { user, activeRole } = await getAuth();
  const stepId = new ObjectId(_id as string);

  const founded = await processStep.findOne({
    filters: { _id: stepId },
    projection: { process: { _id: 1 } },
  }) as Document | null;

  if (!founded) throwError("processStep not exist");

  await assertCanReadProcessStep(activeRole, user, founded);

  const foundedItem = await processStep
    .aggregation({
      pipeline: [{ $match: { _id: stepId } }],
      projection: get,
    })
    .toArray();
  foundedItem.length < 1 && throwError("processStep not exist");
  return foundedItem[0];
};
