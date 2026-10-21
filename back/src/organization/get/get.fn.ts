import { type ActFn, ObjectId } from "lesan";
import { organization } from "../../../mod.ts";
import { getAuth } from "../../../utils/grantAccess.ts";
import { assertCanReadOrganization } from "../../../utils/readScope.ts";

export const getFn: ActFn = async (body) => {
  const {
    set: { _id },
    get,
  } = body.details;

  const { user, activeRole } = await getAuth();

  assertCanReadOrganization(activeRole, user, _id as string);

  return await organization
    .aggregation({
      pipeline: [{ $match: { _id: new ObjectId(_id as string) } }],
      projection: get,
    })
    .toArray();
};
