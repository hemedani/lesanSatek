import type { ActFn, Document } from "lesan";
import { user } from "../../../mod.ts";

export const countUsersFn: ActFn = async (body) => {
  const {
    set: { roles },
    get,
  } = body.details;

  const filter: Document = {};
  roles && roles.length > 0 && (filter["roles.name"] = { $in: roles });

  const qty = await user.countDocument({
    filter,
  });

  return { qty };
};
