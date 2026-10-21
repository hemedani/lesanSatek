import { type ActFn, ObjectId } from "lesan";
import { unit } from "../../../mod.ts";
import { getAuth } from "../../../utils/grantAccess.ts";
import { assertCanReadUnit } from "../../../utils/readScope.ts";

export const getFn: ActFn = async (body) => {
  const {
    set: { _id },
    get,
  } = body.details;

  const { user, activeRole } = await getAuth();

  await assertCanReadUnit(activeRole, user, _id as string);

  return await unit
    .aggregation({
      pipeline: [{ $match: { _id: new ObjectId(_id as string) } }],
      projection: get,
    })
    .toArray();
};
