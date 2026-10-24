import type { ActFn, Document } from "lesan";
import { user } from "../../../mod.ts";
import { getAuth } from "../../../utils/grantAccess.ts";
import { userReadFilter } from "../../../utils/readScope.ts";

export const countUsersFn: ActFn = async (body) => {
  const {
    set: { roles },
  } = body.details;

  const { user: authUser, activeRole } = await getAuth();
  const scopeFilter = userReadFilter(activeRole, authUser);

  const filter: Document = { ...(scopeFilter ?? {}) };
  roles && roles.length > 0 && (filter["roles.name"] = { $in: roles });

  const qty = await user.countDocument({
    filter,
  });

  return { qty };
};
