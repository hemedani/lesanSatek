import { type ActFn, type Document, ObjectId } from "lesan";
import { process } from "../../../mod.ts";
import { isScopeBypass } from "../../../utils/authzPolicy.ts";
import { getAuth } from "../../../utils/grantAccess.ts";
import { throwError } from "../../../utils/throwError.ts";
import { assertCanReadProcess } from "../readScope.ts";

export const getFn: ActFn = async (body) => {
  const {
    set: { _id },
    get,
  } = body.details;

  const { user, activeRole } = await getAuth();
  const processId = new ObjectId(_id as string);

  if (!isScopeBypass(activeRole, user)) {
    const founded = await process.findOne({
      filters: { _id: processId },
      projection: { organization: { _id: 1 }, unit: { _id: 1 } },
    }) as Document | null;

    if (!founded) throwError("You cant do this");

    await assertCanReadProcess(activeRole, user, founded);
  }

  return await process
    .aggregation({
      pipeline: [{ $match: { _id: processId } }],
      projection: get,
    })
    .toArray();
};
